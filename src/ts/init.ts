import { CommentSystem } from './commentSystem'; // Укажите правильный путь к вашему модулю

document.addEventListener('DOMContentLoaded', async () => {
    const commentSystem = new CommentSystem();

    await commentSystem.loadRandomUser();
    await commentSystem.loadComments();
    commentSystem.updateCommentCount();

    const newCommentText = document.getElementById('new-comment-text') as HTMLTextAreaElement | null;
    if (newCommentText) {
        newCommentText.addEventListener('input', () => commentSystem.updateCharCount());
        newCommentText.addEventListener('input', () => commentSystem.adjustTextareaHeight());
    }

    const submitButton = document.querySelector('button.submit-button') as HTMLButtonElement | null;
    if (submitButton) {
        submitButton.addEventListener('click', async () => await commentSystem.addComment());
    }

    const sortByDate = document.getElementById('sort-by-date') as HTMLElement | null;
    if (sortByDate) {
        sortByDate.addEventListener('click', () => commentSystem.sortComments('date', commentSystem.currentSort.order === 'asc' ? 'desc' : 'asc'));
    }

    const sortByVotes = document.getElementById('sort-by-votes') as HTMLElement | null;
    if (sortByVotes) {
        sortByVotes.addEventListener('click', () => commentSystem.sortComments('votes', commentSystem.currentSort.order === 'asc' ? 'desc' : 'asc'));
    }

    const filterFavorites = document.getElementById('filter-favorites') as HTMLElement | null;
    if (filterFavorites) {
        filterFavorites.addEventListener('click', () => commentSystem.filterComments('favorites'));
    }

    const filterHighRating = document.getElementById('filter-high-rating') as HTMLElement | null;
    if (filterHighRating) {
        filterHighRating.addEventListener('click', () => commentSystem.filterComments('high-rating'));
    }

    const filterLowRating = document.getElementById('filter-low-rating') as HTMLElement | null;
    if (filterLowRating) {
        filterLowRating.addEventListener('click', () => commentSystem.filterComments('low-rating'));
    }
});
