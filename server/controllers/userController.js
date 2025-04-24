import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { json } from "express";
import jwt from "jsonwebtoken";
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/profile-images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniquePrefix}${ext}`);
  }
});

export const upload = multer({ 
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only .jpeg, .jpg and .png format allowed!'));
    }
  }
});

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    user = new User({
      username,
      email,
      password: hashedPassword,
    });

    await user.save();

    // Create JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(201).json({ token });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/* MFA SECTION START*/

export const sendEmail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({ //create nodemailer transport to send the email
    service: 'gmail', 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({ //send from @env email acc, create email content
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  });
};

export const verifyMFA = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });
    if (!user || user.mfaCode !== code) {
      return res.status(400).json({ message: 'Invalid MFA code' });
    }
    else if (user.mfaExpiration < Date.now()) {
      return res.status(400).json({ message: 'Expired MFA code' });
    }

    // Reset mfa
    user.mfaCode = null;
    user.mfaExpiration = null;

    // streaks and points
    const today = new Date();
    let lastLoginDate = user.lastLogin ? new Date(user.lastLogin) : null;
    const isDifferentDay = (!lastLoginDate || today.toDateString() !== lastLoginDate.toDateString());

    if (isDifferentDay) {
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      let isStreak = lastLoginDate && lastLoginDate.toDateString() === yesterday.toDateString();

      user.streak = isStreak ? user.streak + 1 : 1;
      user.points += user.streak >= 10 ? 200 : 100;
      user.lastLogin = today;
    }

    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    return res.json({ userInfo: { email: user.email }, token });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/* MFA SECTION END */

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    if (user.mfaOn) {
      // mfa code enabled
      const mfaCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresTime = new Date(Date.now() + 60 * 1000); // 1 minute

      user.mfaCode = mfaCode;
      user.mfaExpiration = expiresTime;
      await user.save();

      await sendEmail(user.email, 'Your MFA Code', `Your code is: ${mfaCode}`);

      return res.status(200).json({ message: "MFA code sent to email" });
    } else {
      // mfa not enabled by user
      const today = new Date();
      let lastLoginDate = user.lastLogin ? new Date(user.lastLogin) : null;
      const isDifferentDay = (!lastLoginDate || today.toDateString() !== lastLoginDate.toDateString());

      if (isDifferentDay) {
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        let isStreak = false;

        if (lastLoginDate && lastLoginDate.toDateString() === yesterday.toDateString()) {
          isStreak = true;
        }
  
        if (isStreak) {
          user.streak += 1;
        } else {
          user.streak = 1;
        }
  
        if (user.streak >= 10) {
          user.points += 200;
        } else {
          user.points += 100;
        }
        user.lastLogin = today;
      }

      await user.save();

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });

      return res.json({ userInfo: { email: user.email }, token });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, password } = req.body;

    // Find user by Id
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Update username if provided
    if (username) {
      user.username = username;
    }

    // Update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    res.json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return current user data (password excluded)
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user by ID (password excluded)
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const searchUser = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({ message: "Search query must be at least 2 characters long." });
    }

    const users = await User.find(
      { email: { $regex: query, $options: 'i' } }, // Case-insensitive
      { email: 1, _id: 0 } // Return only email
    ).limit(10); // Limit results to 10

    res.json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProfileImage = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image file' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user already has a profile image and delete it
    if (user.profileImage) {
      const oldImagePath = path.join('uploads/profile-images', path.basename(user.profileImage));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Update user's profile image path
    const imageUrl = `${process.env.API_URL}/uploads/profile-images/${req.file.filename}`;
    user.profileImage = imageUrl;
    await user.save();

    res.status(200).json({ 
      message: 'Profile image updated successfully',
      profileImageUrl: imageUrl
    });
  } catch (error) {
    console.error('Error updating profile image:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updatePoints = async (req, res) => {
  try {
    const { userId } = req.params;
    const { points } = req.body;

    // Find user by Id
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Update User's Points if provided
    if (points) {
      user.points = points;
    }

    await user.save();
    res.json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateMfaOn = async (req, res) => {
  try {
    const { userId } = req.params;
    const { mfaOn } = req.body;

    // Find user by Id
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    user.mfaOn = mfaOn;

    await user.save();
    res.json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get user's points
export const getPoints = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user by Id
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    upoints = user.select("points");

    // return number of user's points
    res.status(200).json(upoints);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

//DO NOT return password field with the users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    if (!users) {
      return res.status(400).json({ message: "Users not found" });
    }

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
}