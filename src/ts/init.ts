import { CommentSystem } from './commentSystem.js';

document.addEventListener('DOMContentLoaded', async () => {
    const commentSystem = new CommentSystem();

    await commentSystem.loadRandomUser();
    commentSystem.addSortEventListeners();
    await commentSystem.loadComments();
    commentSystem.updateCommentCount();

    const submitCommentButton = document.getElementById('submit-comment');
    const newCommentText = document.getElementById('new-comment-text') as HTMLTextAreaElement;
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
});

