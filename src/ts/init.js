"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const commentSystem_1 = require("./commentSystem"); // Укажите правильный путь к вашему модулю
document.addEventListener('DOMContentLoaded', () => __awaiter(void 0, void 0, void 0, function* () {
    const commentSystem = new commentSystem_1.CommentSystem();
    yield commentSystem.loadRandomUser();
    yield commentSystem.loadComments();
    commentSystem.updateCommentCount();
    const newCommentText = document.getElementById('new-comment-text');
    if (newCommentText) {
        newCommentText.addEventListener('input', () => commentSystem.updateCharCount());
        newCommentText.addEventListener('input', () => commentSystem.adjustTextareaHeight());
    }
    const submitButton = document.querySelector('button.submit-button');
    if (submitButton) {
        submitButton.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () { return yield commentSystem.addComment(); }));
    }
    const sortByDate = document.getElementById('sort-by-date');
    if (sortByDate) {
        sortByDate.addEventListener('click', () => commentSystem.sortComments('date', commentSystem.currentSort.order === 'asc' ? 'desc' : 'asc'));
    }
    const sortByVotes = document.getElementById('sort-by-votes');
    if (sortByVotes) {
        sortByVotes.addEventListener('click', () => commentSystem.sortComments('votes', commentSystem.currentSort.order === 'asc' ? 'desc' : 'asc'));
    }
    const filterFavorites = document.getElementById('filter-favorites');
    if (filterFavorites) {
        filterFavorites.addEventListener('click', () => commentSystem.filterComments('favorites'));
    }
    const filterHighRating = document.getElementById('filter-high-rating');
    if (filterHighRating) {
        filterHighRating.addEventListener('click', () => commentSystem.filterComments('high-rating'));
    }
    const filterLowRating = document.getElementById('filter-low-rating');
    if (filterLowRating) {
        filterLowRating.addEventListener('click', () => commentSystem.filterComments('low-rating'));
    }
}));
