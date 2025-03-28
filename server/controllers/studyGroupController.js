import StudyGroup from "../models/StudyGroup.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from 'mongoose';

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

//Set the new message flag
export const setNewMessageFlag = async (req, res) => {
    const { groupId } = req.params;
    const { newMessage } = req.body;  // Get the flag value from the request body

    try {
        // Find the group by ID
        const group = await StudyGroup.findById(groupId);

        if (!group) {
            return res.status(404).json({ message: "Study group not found" });
        }

        // Set the newMessage flag based on the request body
        group.newMessage = newMessage;
        await group.save();

        // Return the updated group
        res.status(200).json(group);
    } catch (e) {
        // Handle any errors
        res.status(500).json({ message: "Server error", error: e.message });
    }
};

// Find and return all study groups
export const getGroupsAll = async (req, res) => {
    try {
        // Retrieve all groups without filtering by email
        const groups = await StudyGroup.find();

        if (groups.length === 0) {
            // No groups found
            return res.status(404).json({ message: "No study groups available" });
        }

        // Return the list of all groups
        res.status(200).json(groups);
    } catch (e) {
        // Handle any errors
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

// Function to add a member to a study group
export const addMemberToGroup = async (req, res) => {
    const { id } = req.params; // Get group ID from request parameters
    const { email } = req.body; // Get the email address from request body

    // Check if email was provided
    if (!email) {
        return res.status(400).json({
            message: 'Email is required',
            errorDetails: 'The request did not include a valid email to add to the group.'
        });
    }

    try {
        // Find the study group by id
        const group = await StudyGroup.findById(id);

        if (!group) {
            return res.status(404).json({
                message: 'Study group not found',
                errorDetails: `No study group found with the id: ${id}.`
            });
        }

        // Add the email to the members array if it's not already present
        if (!group.members.includes(email)) {
            group.members.push(email);
            const statusMessage = {
                _id: new mongoose.Types.ObjectId(),
                sender: '_status_',
                text: `${email} has joined the group`,
                timestamp: new Date(),
            };
            group.messages.push(statusMessage);
        }

        // Save the updated group
        const updatedGroup = await group.save();

        res.status(200).json({
            message: 'Member added successfully',
            group: updatedGroup
        });
    } catch (e) {
        // Log the error for debugging
        console.error('Error adding member:', e);

        res.status(500).json({
            message: 'Server error occurred while adding member',
            errorDetails: `The error occurred while trying to add the email to the group with id: ${id}. Error: ${e.message}`,
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
    const { text, replyToId, replyToSender, replyToText } = req.body;
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
            _id: new mongoose.Types.ObjectId(),
            sender: username,
            text,
            timestamp: new Date(),
        };

        if (replyToId && replyToSender && replyToText) {
            newMessage.replyToId = replyToId;
            newMessage.replyToSender = replyToSender;
            newMessage.replyToText = replyToText;
        }

        group.messages.push(newMessage);
        group.newMessage = true;
        await group.save();

        res.status(201).json({ message: "Message sent", newMessage });
    } catch (e) {
        res.status(500).json({ message: "Server error", error: e.message });
    }
};

export const removeMember = async (req, res) => {
    const { groupId } = req.params;
    const { email } = req.body; // Email of the user to remove

    if (!email) {
        return res.status(400).json({ message: "User email is required" });
    }

    try {
        const group = await StudyGroup.findById(groupId);

        if (!group) {
            return res.status(404).json({ message: "Study group not found" });
        }

        // Check if the user is in the group
        if (!group.members.includes(email)) {
            return res.status(400).json({ message: "User is not a member of this group" });
        }

        // Remove the user
        group.members = group.members.filter(member => member !== email);
        const statusMessage = {
            _id: new mongoose.Types.ObjectId(),
            sender: '_status_',
            text: `${email} has left the group`,
            timestamp: new Date(),
        };
        group.messages.push(statusMessage);
        await group.save();

        res.status(200).json({ message: "User removed from study group", updatedGroup: group });
    } catch (e) {
        res.status(500).json({ message: "Server error", error: e.message });
    }
};

export const deleteMessage = async (req, res) => {
    const { groupId } = req.params;
    const { messageId } = req.body; // Email of the user to remove

    if (!messageId) {
        return res.status(400).json({ message: "MessageId is required" });
    }

    try {
        const group = await StudyGroup.findById(groupId);

        if (!group) {
            return res.status(404).json({ message: "Study group not found" });
        }


        // Check if the message exists
        const messageIndex = group.messages.findIndex(msg => msg._id.toString() === messageId);
        if (messageIndex === -1) {
            return res.status(404).json({ message: "Message not found in the group" });
        }

        // Remove the message
        group.messages.splice(messageIndex, 1);
        await group.save();

        res.status(200).json({ message: "Message deleted", updatedGroup: group });
    } catch (e) {
        res.status(500).json({ message: "Server error", error: e.message });
    }
};

export const getStudyGroupName = async (req, res) => {
    const { groupId } = req.params;

    try {
        const group = await StudyGroup.findById(groupId);

        if (!group) {
            return res.status(404).json({ message: "Study group not found" });
        }

        res.status(200).json(group.name);
    } catch (e) {
        res.status(500).json({ message: "Server error", error: e.message })
    }
}