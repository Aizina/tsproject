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
exports.CommentSystem = void 0;
const user_1 = require("./user");
const comment_1 = require("./comment");
class CommentSystem {
    constructor() {
        this.user = new user_1.User();
        this.comments = this.loadCommentsFromStorage();
        this.currentSort = { field: 'date', order: 'asc' };
        this.randomUser = null;
    }
    loadCommentsFromStorage() {
        const comments = JSON.parse(localStorage.getItem('comments') || '[]');
        return comments.map((comment) => new comment_1.Comment(comment));
    }
    saveCommentsToStorage() {
        localStorage.setItem('comments', JSON.stringify(this.comments));
    }
    updateCommentCount() {
        const commentAmountElement = document.getElementById('comment-amount');
        const comments = JSON.parse(localStorage.getItem('comments') || '[]');
        const commentCount = comments.length;
        if (commentAmountElement) {
            commentAmountElement.textContent = `(${commentCount})`;
        }
    }
    loadRandomUser() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                this.randomUser = yield this.user.fetchRandomUser();
            }
            catch (error) {
                console.error('Ошибка при загрузке пользователя:', error);
                this.randomUser = null;
            }
            if (this.randomUser) {
                const userAvatar = document.getElementById('main-user-avatar');
                if (userAvatar) {
                    userAvatar.src = ((_a = this.randomUser.picture) === null || _a === void 0 ? void 0 : _a.thumbnail) || '';
                }
                const mainUserName = document.getElementById('main-user-name');
                if (mainUserName) {
                    mainUserName.textContent = `${((_b = this.randomUser.name) === null || _b === void 0 ? void 0 : _b.first) || 'Неизвестный'} ${((_c = this.randomUser.name) === null || _c === void 0 ? void 0 : _c.last) || 'Пользователь'}`;
                }
            }
            else {
                alert("Не удалось загрузить данные пользователя. Пожалуйста, перезагрузите страницу.");
            }
        });
    }
    addComment() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const commentTextElement = document.getElementById('new-comment-text');
            if (!commentTextElement)
                return;
            const commentText = commentTextElement.value.trim();
            if (!commentText) {
                alert("Комментарий не может быть пустым.");
                return;
            }
            if (commentText.length > 1000) {
                alert("Комментарий не может быть длиннее 1000 символов.");
                return;
            }
            if (!this.randomUser) {
                alert("Не удалось загрузить данные пользователя. Попробуйте снова.");
                return;
            }
            const newComment = new comment_1.Comment({
                avatar: ((_a = this.randomUser.picture) === null || _a === void 0 ? void 0 : _a.thumbnail) || '',
                name: `${((_b = this.randomUser.name) === null || _b === void 0 ? void 0 : _b.first) || 'Неизвестный'} ${((_c = this.randomUser.name) === null || _c === void 0 ? void 0 : _c.last) || 'Пользователь'}`,
                text: commentText,
                date: new Date(),
                id: Date.now(),
                votes: 0,
                favorites: false,
                parentId: null,
                replyNumber: 0,
                voteColor: 'black'
            });
            this.comments.push(newComment);
            this.saveCommentsToStorage();
            commentTextElement.value = "";
            this.updateCharCount();
            this.adjustTextareaHeight();
            yield this.refreshComments();
            yield this.loadRandomUser();
        });
    }
    saveComment(comment) {
        this.comments = this.comments.filter(c => c.id !== comment.id);
        this.comments.push(comment);
        this.saveCommentsToStorage();
    }
    loadComments() {
        return __awaiter(this, void 0, void 0, function* () {
            const commentsListElement = document.getElementById('comments-list');
            if (commentsListElement) {
                commentsListElement.innerHTML = '';
                this.comments.forEach(comment => this.displayComment(comment));
            }
        });
    }
    displayComment(comment) {
        var _a;
        const existingComment = document.querySelector(`.comment-template[data-id="${comment.id}"], .reply-template[data-id="${comment.id}"]`);
        if (existingComment)
            return;
        const template = comment.parentId === null
            ? document.querySelector('.comment-template').cloneNode(true)
            : document.querySelector('.reply-template').cloneNode(true);
        template.style.display = 'block';
        template.setAttribute('data-id', comment.id.toString());
        const userAvatar = template.querySelector('.user-avatar');
        if (userAvatar)
            userAvatar.src = comment.avatar;
        const userName = template.querySelector('.user-name');
        if (userName)
            userName.textContent = comment.name;
        const commentText = template.querySelector('.comment-text');
        if (commentText)
            commentText.textContent = comment.text;
        const commentDate = template.querySelector('.comment-date');
        if (commentDate)
            commentDate.textContent = this.formatDate(comment.date);
        const voteRating = template.querySelector('.vote-rating');
        if (voteRating) {
            voteRating.textContent = comment.votes.toString();
            voteRating.style.color = comment.voteColor || 'black';
        }
        const upvoteButton = template.querySelector('.upvote-button');
        if (upvoteButton)
            upvoteButton.addEventListener('click', () => this.upVote(comment.id));
        const downvoteButton = template.querySelector('.downvote-button');
        if (downvoteButton)
            downvoteButton.addEventListener('click', () => this.downVote(comment.id));
        const favoriteButton = template.querySelector('.favorite-button');
        if (favoriteButton) {
            favoriteButton.innerHTML = comment.favorites ? '&#9829; В избранном' : '&#9825; В избранное';
            favoriteButton.addEventListener('click', () => this.toggleFavorite(comment.id));
        }
        const replyButton = template.querySelector('.reply-button');
        if (replyButton) {
            replyButton.addEventListener('click', () => this.toggleReplyForm(comment.id));
            const submitReplyButton = template.querySelector('.submit-reply');
            if (submitReplyButton) {
                submitReplyButton.addEventListener('click', () => this.reply(comment.id));
            }
        }
        const commentsList = document.getElementById('comments-list');
        if (comment.parentId === null && commentsList) {
            commentsList.appendChild(template);
            const repliesList = template.querySelector('.replies-list');
            if (repliesList)
                repliesList.innerHTML = "";
        }
        else {
            const parentCommentElement = document.querySelector(`.comment-template[data-id="${comment.parentId}"]`);
            if (parentCommentElement) {
                const parentCommentName = (_a = parentCommentElement.querySelector('.user-name')) === null || _a === void 0 ? void 0 : _a.textContent;
                const parentCommentNameElement = template.querySelector('.parent-comment-name');
                if (parentCommentNameElement) {
                    parentCommentNameElement.textContent = parentCommentName || '';
                }
                else {
                    console.error("Parent comment name element not found in the template.", template);
                }
                const repliesList = parentCommentElement.querySelector('.replies-list');
                if (repliesList) {
                    repliesList.appendChild(template);
                    if (replyButton) {
                        replyButton.style.display = 'none'; // Hide the reply button on replies
                    }
                    else {
                        console.error("Replies list not found in the parent comment element.", parentCommentElement);
                    }
                }
                else {
                    console.error(`Parent comment with id ${comment.parentId} not found.`, template);
                }
            }
        }
    }
    toggleReplyForm(id) {
        const commentElement = document.querySelector(`.comment-template[data-id="${id}"]`);
        if (commentElement) {
            const replyForm = commentElement.querySelector('.reply-form');
            if (replyForm) {
                replyForm.style.display = replyForm.style.display === 'none' ? 'block' : 'none';
            }
        }
        else {
            alert(`Comment with id ${id} not found.`);
        }
    }
    adjustTextareaHeight() {
        const textarea = document.getElementById('new-comment-text');
        if (!textarea)
            return;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    }
    reply(id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const commentElement = document.querySelector(`.comment-template[data-id="${id}"]`);
            if (!commentElement) {
                alert(`Comment with id ${id} not found.`);
                return;
            }
            const replyTextElement = commentElement.querySelector('.reply-text');
            const replyText = replyTextElement.value.trim();
            if (!replyText) {
                alert("Комментарий не может быть пустым.");
                return;
            }
            if (replyText.length > 1000) {
                alert("Комментарий не может быть длиннее 1000 символов.");
                return;
            }
            if (!this.randomUser) {
                alert("Не удалось загрузить данные пользователя. Попробуйте снова.");
                return;
            }
            const newReply = new comment_1.Comment({
                avatar: ((_a = this.randomUser.picture) === null || _a === void 0 ? void 0 : _a.thumbnail) || '',
                name: `${((_b = this.randomUser.name) === null || _b === void 0 ? void 0 : _b.first) || 'Неизвестный'} ${((_c = this.randomUser.name) === null || _c === void 0 ? void 0 : _c.last) || 'Пользователь'}`,
                text: replyText,
                date: new Date(),
                id: Date.now(),
                votes: 0,
                favorites: false,
                parentId: id,
                replyNumber: 0,
                voteColor: 'black'
            });
            this.comments.push(newReply);
            this.saveCommentsToStorage();
            replyTextElement.value = "";
            this.updateCharCount();
            this.adjustTextareaHeight();
            yield this.refreshComments();
            yield this.loadRandomUser();
        });
    }
    updateCharCount() {
        const commentTextElement = document.getElementById('new-comment-text');
        if (!commentTextElement)
            return;
        const charCount = commentTextElement.value.length;
        const charCountDisplay = document.getElementById('char-count');
        const charWarning = document.getElementById('char-warning');
        const submitButton = document.querySelector('button.submit-button');
        if (charCountDisplay) {
            charCountDisplay.textContent = `${charCount}/1000`;
        }
        if (charCount > 1000) {
            if (charWarning)
                charWarning.style.display = 'block';
            if (submitButton)
                submitButton.disabled = true;
        }
        else {
            if (charWarning)
                charWarning.style.display = 'none';
            if (submitButton)
                submitButton.disabled = false;
        }
    }
    sortComments(field_1) {
        return __awaiter(this, arguments, void 0, function* (field, order = 'asc') {
            if (field === 'date') {
                this.comments.sort((a, b) => order === 'asc' ? new Date(a.date).getTime() - new Date(b.date).getTime() : new Date(b.date).getTime() - new Date(a.date).getTime());
            }
            else if (field === 'votes') {
                this.comments.sort((a, b) => order === 'asc' ? a.votes - b.votes : b.votes - a.votes);
            }
            this.currentSort = { field, order };
            yield this.refreshComments();
        });
    }
    upVote(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const comment = this.comments.find(comment => comment.id === id);
            if (comment) {
                comment.votes += 1;
                comment.voteColor = comment.votes > 0 ? 'green' : comment.votes === 0 ? 'black' : 'red';
                this.saveComment(comment);
                yield this.refreshComments();
            }
        });
    }
    downVote(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const comment = this.comments.find(comment => comment.id === id);
            if (comment) {
                comment.votes -= 1;
                comment.voteColor = comment.votes > 0 ? 'green' : comment.votes === 0 ? 'black' : 'red';
                this.saveComment(comment);
                yield this.refreshComments();
            }
        });
    }
    toggleFavorite(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const comment = this.comments.find(comment => comment.id === id);
            if (comment) {
                comment.favorites = !comment.favorites;
                this.saveComment(comment);
                yield this.refreshComments();
            }
        });
    }
    formatDate(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
        if (diffInSeconds < 60) {
            return 'Только что';
        }
        else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} мин. назад`;
        }
        else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} час. назад`;
        }
        else {
            return new Date(date).toLocaleDateString();
        }
    }
    refreshComments() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadComments();
            this.updateCommentCount();
        });
    }
    filterComments(filter) {
        const comments = JSON.parse(localStorage.getItem('comments') || '[]');
        let filteredComments;
        switch (filter) {
            case 'favorites':
                filteredComments = comments.filter((comment) => comment.favorites);
                break;
            case 'high-rating':
                filteredComments = comments.filter((comment) => comment.votes > 0);
                break;
            case 'low-rating':
                filteredComments = comments.filter((comment) => comment.votes < 0);
                break;
            default:
                filteredComments = comments;
                break;
        }
        this.comments = filteredComments.map((comment) => new comment_1.Comment(comment));
        this.refreshComments();
    }
}
exports.CommentSystem = CommentSystem;
