import Class from "../models/Class.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Find and return all study groups that the given user is a member of
export const getClasses = async (req, res) => {
  try {
    const classes = await Class.find();
    res.status(200).json(classes);
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const createClass = async (req, res) => {
    const { name, credits, userId } = req.body;
  
    // Validate input before creating class
    if (!name || !credits) {
      return res.status(400).json({ message: 'name or credits missing' });
    }
  
    try {
      const newClass = new Class({
        name,
        credits,
        userId,
      });
  
      const savedClass = await newClass.save();
      res.status(201).json(savedClass);
    } catch (e) {
      res.status(500).json({ message: 'Server error', error: e.message });
    }
  };

// New function to delete a class
export const deleteClass = async (req, res) => {
    const { id } = req.params; // Get class ID from request parameters

    try {
        //Attempt to Delete a Class by id
        const deletedClass= await Class.findByIdAndDelete(id);

        if (!deletedClass) {
            return res.status(404).json({ message: 'Class not found' });
        }

        res.status(200).json({ message: 'Class deleted successfully' });
    } catch (e) {
        res.status(500).json({ message: 'Server error', error: e.message });
    }
};

