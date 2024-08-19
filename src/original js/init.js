import { CommentSystem } from './commentSystem.js';


document.addEventListener('DOMContentLoaded', async () => {
    const commentSystem = new CommentSystem();

    await commentSystem.loadRandomUser();
    commentSystem.addSortEventListeners();
    await commentSystem.loadComments();
    commentSystem.updateCommentCount(); 

    document.getElementById('submit-comment').addEventListener('click', () => commentSystem.addComment());
    document.getElementById('submit-comment').addEventListener('click', () => commentSystem.updateCommentCount());
    document.getElementById('new-comment-text').addEventListener('input', () => {
        commentSystem.updateCharCount();
        commentSystem.adjustTextareaHeight();
    });
    document.getElementById('clear-storage').addEventListener('click', () => {
        localStorage.removeItem('comments');
        commentSystem.comments = [];
        commentSystem.refreshComments();
        commentSystem.updateCommentCount();
    });



});
