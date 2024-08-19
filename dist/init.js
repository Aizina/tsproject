var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { CommentSystem } from './commentSystem.js';
document.addEventListener('DOMContentLoaded', () => __awaiter(void 0, void 0, void 0, function* () {
    const commentSystem = new CommentSystem();
    yield commentSystem.loadRandomUser();
    commentSystem.addSortEventListeners();
    yield commentSystem.loadComments();
    commentSystem.updateCommentCount();
    const submitCommentButton = document.getElementById('submit-comment');
    const newCommentText = document.getElementById('new-comment-text');
    const clearStorageButton = document.getElementById('clear-storage');
    if (submitCommentButton) {
        submitCommentButton.addEventListener('click', () => commentSystem.addComment());
        submitCommentButton.addEventListener('click', () => commentSystem.updateCommentCount());
    }
    if (newCommentText) {
        newCommentText.addEventListener('input', () => {
            commentSystem.updateCharCount();
            commentSystem.adjustTextareaHeight();
        });
    }
    if (clearStorageButton) {
        clearStorageButton.addEventListener('click', () => {
            localStorage.removeItem('comments');
            commentSystem.comments = [];
            commentSystem.refreshComments();
            commentSystem.updateCommentCount();
        });
    }
}));
