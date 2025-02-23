import StudyGroup from "../models/StudyGroup.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Find and return all study groups that the given user is a member of
export const getGroups = async (req, res) => {
  try {
    const { email } = req.params;

    const groups = await StudyGroup.find({ members: email });

    if (groups.length == 0) {
      // No groups found
      return res.status(404).json({ message: "User has no study groups" });
    }

    res.status(200).json(groups);
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const createStudyGroup = async (req, res) => {
    const { name, members } = req.body;
  
    // Validate input before creating group
    if (!name || !Array.isArray(members)) {
      return res.status(400).json({ message: 'Invalid input. Make sure you provide a name and at least one member' });
    }
  
    try {
      const newGroup = new StudyGroup({
        name,
        members,
        messages: [], // Starts with no messages
      });
  
      const savedGroup = await newGroup.save();
      res.status(201).json(savedGroup);
    } catch (e) {
      res.status(500).json({ message: 'Server error', error: e.message });
    }
  };