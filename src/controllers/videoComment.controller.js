import VideoCommentModel from "../models/videoComment.model.js";
import { VideoCommentService } from "../services/comment.service.js";
import buildTree from "../utils/treeCommnet.js";

const createComment = async (req, res) => {
    try {
        const { content, parentId } = req.body;
        const userId = req.user.id;
        const videoId = req.params.videoId;

        if (!content) {
            return res.status(400).json({ success: false, message: 'Nội dung không được bỏ trống.' });
        }

        const comment = await VideoCommentService.createComment({
            content,
            parentId,
            userId,
            videoId,
        });

        res.status(201).json({
            success: true,
            message: 'Tạo bình luận thành công.',
            data: comment,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Tạo bình luận thất bại.',
            error: err.message,
        });
    }
};


const getCommentById = async (req, res) => {
    try {
        const comment = await VideoCommentService.getCommentById(req.params.id);
        if (!comment) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận.' });
        }
        res.json({ success: true, data: comment });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const updateComment = async (req, res) => {
    try {
        const updated = await VideoCommentService.updateComment(req.params.id, req.body);
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận để cập nhật.' });
        }
        res.json({ success: true, message: 'Cập nhật bình luận thành công.', data: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Cập nhật thất bại.', error: err.message });
    }
};

const deleteComment = async (req, res) => {
    try {
        const deleted = await VideoCommentService.deleteComment(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận để xóa.' });
        }
        res.json({ success: true, message: 'Xóa bình luận thành công.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Xóa thất bại.', error: err.message });
    }
};

const getCommentsByVideo = async (req, res) => {
    try {
        const comments = await VideoCommentModel.find({ videoId: req.params.videoId }).populate('userId', 'name') // lấy name của người dùng
            .lean();
        const treeComments = buildTree(comments);
        res.json({ success: true, data: treeComments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export const videoCommentController = {
    createComment,
    updateComment,
    deleteComment,
    getCommentById,
    getCommentsByVideo
}