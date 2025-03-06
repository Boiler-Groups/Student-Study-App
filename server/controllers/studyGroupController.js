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

// New function to delete a study group
export const deleteStudyGroup = async (req, res) => {
    const { id } = req.params; // Get group ID from request parameters

    try {
        //Attempt to Delete a Study Group by id
        const deletedGroup = await StudyGroup.findByIdAndDelete(id);

        if (!deletedGroup) {
            return res.status(404).json({ message: 'Study group not found' });
        }

        res.status(200).json({ message: 'Study group deleted successfully' });
    } catch (e) {
        res.status(500).json({ message: 'Server error', error: e.message });
    }
};

// New function to edit the name of a study group
export const editStudyGroupName = async (req, res) => {
    const { id } = req.params; // Get group ID from request parameters
    const { name } = req.body; // Get the new group name from request body

    // Check if the name was provided
    if (!name) {
        return res.status(400).json({
            message: 'Group name is required',
            errorDetails: 'The request did not include a name for the group.'
        });
    }

    try {
        // Attempt to find and update the Study Group by id
        const updatedGroup = await StudyGroup.findByIdAndUpdate(id, { name }, { new: true });

        if (!updatedGroup) {
            return res.status(404).json({
                message: 'Study group not found',
                errorDetails: `No study group found with the id: ${id}.`
            });
        }

        res.status(200).json({
            message: 'Study group name updated successfully',
            group: updatedGroup
        });
    } catch (e) {
        // Log the error for debugging
        console.error('Error updating study group:', e);

        res.status(500).json({
            message: 'Server error occurred while updating the study group',
            errorDetails: `The error occurred while trying to update the group with id: ${id}. Error: ${e.message}`,
            errorStack: e.stack
        });
    }
};

// Fetch all messages for a study group
export const getGroupMessages = async (req, res) => {
  const { groupId } = req.params;

  try {
      const group = await StudyGroup.findById(groupId);

      if (!group) {
          return res.status(404).json({ message: "Study group not found" });
      }

      res.status(200).json(group.messages);
  } catch (e) {
      res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const getGroupMembers = async (req, res) => {
  const { groupId } = req.params;

  try {
      const group = await StudyGroup.findById(groupId);

      if (!group) {
          return res.status(404).json({ message: "Study group not found" });
      }

      res.status(200).json(group.members);
  } catch (e) {
      res.status(500).json({ message: "Server error", error: e.message });
  }
};

// Send a message to a study group
export const sendMessage = async (req, res) => {
  const { groupId } = req.params;
  const { text } = req.body;
  const userEmail = req.user.email; // Assuming authentication middleware sets req.user
  const username = req.user.username

  if (!text) {
      return res.status(400).json({ message: "Message text is required" });
  }

  try {
      const group = await StudyGroup.findById(groupId);

      if (!group) {
          return res.status(404).json({ message: "Study group not found" });
      }

      const newMessage = {
          sender: username,
          text,
          timestamp: new Date(),
      };

      group.messages.push(newMessage);
      await group.save();

      res.status(201).json({ message: "Message sent", newMessage });
  } catch (e) {
      res.status(500).json({ message: "Server error", error: e.message });
  }
};
