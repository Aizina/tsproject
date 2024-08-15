import { CommentSystem } from 'commentSystem.js';

document.addEventListener('DOMContentLoaded', async () => {
    const commentSystem = new CommentSystem();

    await commentSystem.loadRandomUser();
    await commentSystem.loadComments();
    commentSystem.updateCommentCount();

    document.getElementById('new-comment-text').addEventListener('input', () => commentSystem.updateCharCount());
    document.getElementById('new-comment-text').addEventListener('input', () => commentSystem.adjustTextareaHeight());

    document.querySelector('button.submit-button').addEventListener('click', async () => await commentSystem.addComment());

    document.getElementById('sort-by-date').addEventListener('click', () => commentSystem.sortComments('date', commentSystem.currentSort.order === 'asc' ? 'desc' : 'asc'));
    document.getElementById('sort-by-votes').addEventListener('click', () => commentSystem.sortComments('votes', commentSystem.currentSort.order === 'asc' ? 'desc' : 'asc'));

    document.getElementById('filter-favorites').addEventListener('click', () => commentSystem.filterComments('favorites'));
    document.getElementById('filter-high-rating').addEventListener('click', () => commentSystem.filterComments('high-rating'));
    document.getElementById('filter-low-rating').addEventListener('click', () => commentSystem.filterComments('low-rating'));
});
