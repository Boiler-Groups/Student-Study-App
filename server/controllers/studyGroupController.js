import StudyGroup from "../models/StudyGroup.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from "@google/generative-ai";


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

export const getGroup = async (req, res) => {
    try {
        const { groupId } = req.params;

        const group = await StudyGroup.findById(groupId);

        if (!group) {
            return res.status(404).json({ message: "Study group not found" });
        }

        res.status(200).json(group);
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

//Add all group members to membersWithUnopenedMessages array
export const addAllMembersToUnopenedMessageGroup = async (req, res) => {
    //console.log("Received add ALL To UnopenedMessages Request");
    const { groupId } = req.params;

    try {
        const group = await StudyGroup.findById(groupId);

        if (!group) {
            return res.status(404).json({
                message: 'Study group not found',
                errorDetails: `No study group found with the id: ${id}.`
            });
        }
        //Combine the current membersWithUnopenedMessages with the all group members
        const combinedMembers = [...group.membersWithUnopenedMessages, ...group.members];

        //Use a set to remove duplicates
        const uniqueMembers = new Set(combinedMembers);

        //Convert the set back to an array
        group.membersWithUnopenedMessages = [...uniqueMembers];

        ///Save the update group
        const updatedGroup = await group.save();

        res.status(200).json({
            message: 'All members added to UnopenedMessageGroup successfully',
            group: updatedGroup
        });
    } catch (e) {
        //Log Any errors
        console.error('Error Updating members with New MEssages');
        res.status(500).json({
            message: 'Server error occurred while attempting to addAllMembersToUnopenedMessageGroup',
            errorDetails: `An error occurred while processing the request for group id: ${id}, Error:${e.message}`,
            errorStack: e.stack
        });
    }

};

//Function nto remove a member from the memberWithUnopenedMessages Array
export const removeMemberFromUnopenedMessageGroup = async (req, res) => {
    //console.log("Received remove from UnopenedMessages Request");
    const { groupId, email } = req.params;

    try {
        const group = await StudyGroup.findById(groupId);

        if (!group) {
            return res.status(404).json({
                message: 'Study group was not found',
                errorDetails: `No study group was found with the id: ${groupId}`
            });
        }

        //Use the .filter() to create a new array that constains only the members who are not the email
        //we want to remove
        group.membersWithUnopenedMessages = group.membersWithUnopenedMessages.filter(members => members !== email);

        const updatedGroup = await group.save();

        res.status(200).json({
            message: `${email} removed from membersWithUnopenedMessages successfully`,
            group: updatedGroup
        });

    } catch (e) {
        //Log Any errors
        console.error('Error Updating members with New MEssages');
        res.status(500).json({
            message: 'Server error occurred while attempting to addAllMembersToUnopenedMessageGroup',
            errorDetails: `An error occurred while processing the request for group id: ${groupId}, Error:${e.message}`,
            errorStack: e.stack
        });
    }
}

// Function to get the list of members with unopened messages
export const getMembersWithUnopenedMessages = async (req, res) => {
    //console.log("Received get Members with UnopenedMessages Request");
    const { groupId } = req.params; // Get group ID from URL parameters

    try {
        // Find the study group by ID
        const group = await StudyGroup.findById(groupId);

        if (!group) {
            return res.status(404).json({
                message: 'Study group not found',
                errorDetails: `No study group found with the id: ${groupId}.`
            });
        }

        // Get the list of members with unopened messages
        const membersWithUnopenedMessages = group.membersWithUnopenedMessages;

        // Return the list of members as a response
        res.status(200).json({
            message: 'Members with unopened messages fetched successfully',
            members: membersWithUnopenedMessages
        });
    } catch (e) {
        console.error('Error fetching members with unopened messages:', e);

        res.status(500).json({
            message: 'Server error occurred while fetching members with unopened messages',
            errorDetails: `An error occurred while processing the request for group id: ${groupId}. Error: ${e.message}`,
            errorStack: e.stack
        });
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
    const { name, members, isDM } = req.body;
    let isNewDM;

    if (!isDM) {
        isNewDM = false;
    } else {
        isNewDM = isDM;
    }

    // Validate input before creating group
    if (!name || !Array.isArray(members)) {
        return res.status(400).json({ message: 'Invalid input. Make sure you provide a name and at least one member' });
    }

    try {
        const newGroup = new StudyGroup({
            name,
            members,
            messages: [], // Starts with no messages
            isDM: isNewDM,
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
    const userEmail = req.user.email;
    const username = req.user.username;

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
            reactions: [],
            timestamp: new Date(),
        };

        if (replyToId && replyToSender && replyToText) {
            newMessage.replyToId = replyToId;
            newMessage.replyToSender = replyToSender;
            newMessage.replyToText = replyToText;

            const originalMessage = group.messages.find(msg =>
                msg._id.toString() === replyToId
            );

            if (originalMessage && originalMessage.sender === replyToSender) {
                const repliedToUser = group.members.find(member => {
                    const memberUsername = member.split('@')[0];
                    return memberUsername.toLowerCase() === replyToSender.toLowerCase();
                });

                if (repliedToUser && repliedToUser !== userEmail) {
                    if (!group.membersTaggedOrReplied) {
                        group.membersTaggedOrReplied = [];
                    }
                    if (!group.membersTaggedOrReplied.includes(repliedToUser)) {
                        group.membersTaggedOrReplied.push(repliedToUser);
                    }
                }
            }
        }

        const emailRegex = /@([\w.-]+@[\w.-]+\.\w+)/g;
        const taggedEmails = [];
        let match;

        while ((match = emailRegex.exec(text)) !== null) {
            const taggedEmail = match[1];
            if (group.members.includes(taggedEmail) && taggedEmail !== userEmail) {
                taggedEmails.push(taggedEmail);
            }
        }

        if (taggedEmails.length > 0) {
            if (!group.membersTaggedOrReplied) {
                group.membersTaggedOrReplied = [];
            }

            taggedEmails.forEach(email => {
                if (!group.membersTaggedOrReplied.includes(email)) {
                    group.membersTaggedOrReplied.push(email);
                }
            });
        }

        group.messages.push(newMessage);
        group.newMessage = true;
        await group.save();

        res.status(201).json({ message: "Message sent", newMessage });
    } catch (e) {
        res.status(500).json({ message: "Server error", error: e.message });
    }
};

export const likeMessage = async (req, res) => {
    const { groupId } = req.params;
    const { messageId } = req.body;

    const userId = req.user._id;
    const userEmail = req.user.email; // Assuming authentication middleware sets req.user
    const username = req.user.username;

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

        if (!group.messages[messageIndex].reactions.includes(userId.toString())) {
            group.messages[messageIndex].reactions.push(userId.toString());
            group.markModified("messages");

            await group.save();
        }


        res.status(200).json({ message: "Message liked", updatedGroup: group });
    } catch (e) {
        res.status(500).json({ message: "Server error", error: e.message });
    }
}

export const toggleMessageReaction = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { messageId, isLike } = req.body;
        const userId = req.user._id.toString();

        const group = await StudyGroup.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Study group not found' });
        }

        const messageIndex = group.messages.findIndex(msg => msg._id.toString() === messageId);
        if (messageIndex === -1) {
            return res.status(404).json({ message: 'Message not found in the group' });
        }

        const message = group.messages[messageIndex];
        const likeKey = `${userId}-like`;
        const dislikeKey = `${userId}-dislike`;

        if (isLike) {
            // Toggle like
            if (message.reactions.includes(likeKey)) {
                message.reactions = message.reactions.filter(
                    r => r !== likeKey
                );
            } else {
                message.reactions.push(likeKey);
            }

        } else {
            // Toggle dislike
            if (message.reactions.includes(dislikeKey)) {
                message.reactions = message.reactions.filter(
                    r => r !== dislikeKey
                );
            } else {
                message.reactions.push(dislikeKey);
            }
        }

        group.markModified('messages');
        await group.save();

        res.status(200).json({ message: 'Reaction updated', updatedMessage: message });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
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
    const { messageId } = req.body;

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
};

export const addTaggedOrRepliedUser = async (req, res) => {
    const { groupId } = req.params;
    const { email } = req.body;

    try {
        const group = await StudyGroup.findById(groupId);

        if (!group) {
            return res.status(404).json({
                message: 'Study group not found',
                errorDetails: `No study group found with the id: ${groupId}.`
            });
        }

        if (!group.membersTaggedOrReplied.includes(email)) {
            group.membersTaggedOrReplied.push(email);
        }

        const updatedGroup = await group.save();

        res.status(200).json({
            message: `${email} added to taggedOrReplied list successfully`,
            group: updatedGroup
        });
    } catch (e) {
        console.error('Error updating tagged users:', e);
        res.status(500).json({
            message: 'Server error occurred while updating tagged users',
            errorDetails: e.message
        });
    }
};

export const removeTaggedOrRepliedUser = async (req, res) => {
    const { groupId, email } = req.params;

    try {
        const group = await StudyGroup.findById(groupId);

        if (!group) {
            return res.status(404).json({
                message: 'Study group not found',
                errorDetails: `No study group found with the id: ${groupId}.`
            });
        }

        if (!group.membersTaggedOrReplied) {
            group.membersTaggedOrReplied = [];
        } else {
            group.membersTaggedOrReplied = group.membersTaggedOrReplied.filter(
                member => member !== email
            );
        }

        const updatedGroup = await group.save();

        res.status(200).json({
            message: `${email} removed from taggedOrReplied list successfully`,
            group: updatedGroup
        });
    } catch (e) {
        console.error('Error updating tagged users:', e);
        res.status(500).json({
            message: 'Server error occurred while updating tagged users',
            errorDetails: e.message
        });
    }
};

export const getTaggedOrRepliedUsers = async (req, res) => {
    const { groupId } = req.params;

    try {
        const group = await StudyGroup.findById(groupId);

        if (!group) {
            return res.status(404).json({
                message: 'Study group not found',
                errorDetails: `No study group found with the id: ${groupId}.`
            });
        }

        res.status(200).json({
            message: 'Tagged or replied users fetched successfully',
            users: group.membersTaggedOrReplied
        });
    } catch (e) {
        console.error('Error fetching tagged users:', e);
        res.status(500).json({
            message: 'Server error occurred while fetching tagged users',
            errorDetails: e.message
        });
    }
};

export const isDM = async (req, res) => {
    const { groupId } = req.params;

    try {
        const group = await StudyGroup.findById(groupId);

        if (!group) {
            return res.status(404).json({
                message: 'Study group not found',
                errorDetails: `No study group found with the id: ${groupId}.`
            });
        }

        res.status(200).json(group.isDM);

    } catch (e) {
        console.error('Error checking DM status:', e);
        res.status(500).json({
            message: 'Server error occurred while checking DM status',
            errorDetails: e.message
        });
    }
}

export const edbotSettings = async (req, res) => {
    const { edbotEnabled, edbotName, edbotPersonality } = req.body;
    const { groupId } = req.params;

    if (!edbotName) {
        return res.status(400).json({ error: "Invalid Edbot name" });
    }

    try {
        const group = await StudyGroup.findById(groupId);

        if (!group) {
            return res.status(404).json({
                message: 'Study group not found',
                errorDetails: `No study group found with the id: ${groupId}.`
            });
        }

        group.edbotEnabled = edbotEnabled;
        group.edbotName = edbotName;
        group.edbotPersonality = edbotPersonality;

        await group.save();

        res.status(200).json({ message: 'Edbot settings updated', updatedGroup: group });

    } catch (error) {
        console.error("Summarization error:", error);
        res.status(500).json({ error: "Failed to summarize notes" });
    }
}

export const edbotResponse = async (req, res) => {
    const { text, edbotName, edbotPersonality } = req.body;
    const { groupId } = req.params;

    if (!text) return res.status(400).json({ error: "No message provided" });

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const prompt = `Context: You are an education assisstant named ${edbotName}, 
                make your response with a ${edbotPersonality} personality, 
                and your responses will be viewed as plain text. You will be given a student's message to respond to.
                If it contains no meaningful information, respond with an explanation of your purpose.
                 Now respond to this student's message:\n\n${text}.`;
        console.log(prompt)
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const summary = response.text().replace(/`(.*?)`/g, "'$1'");
        const group = await StudyGroup.findById(groupId);

        if (!group) {
            return res.status(404).json({ message: "Study group not found" });
        }

        const newMessage = {
            _id: new mongoose.Types.ObjectId(),
            sender: 'Edbot',
            text: summary,
            reactions: [],
            timestamp: new Date(),
        };


        group.messages.push(newMessage);
        group.newMessage = true;
        await group.save();

        res.status(201).json({ message: "Message sent", newMessage });

    } catch (error) {
        console.error("Edbot error:", error);
        res.status(500).json({ error: "Failed to generate response" });
    }
}