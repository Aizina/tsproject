import { User } from 'user.js';
import { Comment } from 'comment.js';

export class CommentSystem {
    constructor() {
        this.user = new User();
        this.comments = this.loadCommentsFromStorage();
        this.currentSort = { field: 'date', order: 'asc' };
        this.randomUser = null;
    }

    loadCommentsFromStorage() {
        const comments = JSON.parse(localStorage.getItem('comments')) || [];
        return comments.map(comment => new Comment(comment));
    }

    saveCommentsToStorage() {
        localStorage.setItem('comments', JSON.stringify(this.comments));
    }

    updateCommentCount() {
        const commentAmountElement = document.getElementById('comment-amount');
        const comments = JSON.parse(localStorage.getItem('comments')) || [];
        const commentCount = comments.length;
        commentAmountElement.textContent = `(${commentCount})`;
    };

    async loadRandomUser() {
        this.randomUser = await this.user.fetchRandomUser();
        if (this.randomUser) {
            const userAvatar = document.getElementById('main-user-avatar');
            userAvatar.src = this.randomUser.picture.thumbnail;
            const mainUserName = document.getElementById('main-user-name');
            mainUserName.textContent = this.randomUser.name.first + ' ' + this.randomUser.name.last;
        } else {
            alert("Не удалось загрузить данные пользователя. Пожалуйста, перезагрузите страницу.");
        }
    }

    async addComment() {
        const commentText = document.getElementById('new-comment-text').value.trim();
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

        const newComment = new Comment({
            avatar: this.randomUser.picture.thumbnail,
            name: this.randomUser.name.first + ' ' + this.randomUser.name.last,
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
        document.getElementById('new-comment-text').value = "";
        this.updateCharCount();
        this.adjustTextareaHeight();
        await this.refreshComments();
        await this.loadRandomUser();
    }

    saveComment(comment) {
        this.comments = this.comments.filter(c => c.id !== comment.id);
        this.comments.push(comment);
        this.saveCommentsToStorage();
    }

    async loadComments() {
        document.getElementById('comments-list').innerHTML = '';
        this.comments.forEach(comment => this.displayComment(comment));
    }

    displayComment(comment) {
        const existingComment = document.querySelector(`.comment-template[data-id="${comment.id}"], .reply-template[data-id="${comment.id}"]`);
        if (existingComment) {
            return;
        }

        const template = comment.parentId === null
            ? document.querySelector('.comment-template').cloneNode(true)
            : document.querySelector('.reply-template').cloneNode(true);

        template.style.display = 'block';
        template.setAttribute('data-id', comment.id);
        template.querySelector('.user-avatar').src = comment.avatar;
        template.querySelector('.user-name').textContent = comment.name;
        template.querySelector('.comment-text').textContent = comment.text;
        template.querySelector('.comment-date').textContent = this.formatDate(comment.date);
        template.querySelector('.vote-rating').textContent = comment.votes;
        template.querySelector('.upvote-button').addEventListener('click', () => this.upVote(comment.id));
        template.querySelector('.downvote-button').addEventListener('click', () => this.downVote(comment.id));
        template.querySelector('.vote-rating').style.color = comment.voteColor || 'black';

        const favoriteButton = template.querySelector('.favorite-button');
        favoriteButton.innerHTML = comment.favorites ? '&#9829; В избранном' : '&#9825; В избранное';
        favoriteButton.addEventListener('click', () => this.toggleFavorite(comment.id));

        const replyButton = template.querySelector('.reply-button');
        if (replyButton) {
            replyButton.addEventListener('click', () => this.toggleReplyForm(comment.id));

            const submitReplyButton = template.querySelector('.submit-reply');
            if (submitReplyButton) {
                submitReplyButton.addEventListener('click', () => this.reply(comment.id));
            }
        }

        if (comment.parentId === null) {
            document.getElementById('comments-list').appendChild(template);
            document.querySelector(`.comment-template[data-id="${comment.id}"] .replies-list`).innerHTML = "";
        } else {
            const parentCommentElement = document.querySelector(`.comment-template[data-id="${comment.parentId}"]`);
            if (parentCommentElement) {
                const parentCommentElementName = parentCommentElement.querySelector('.user-name')?.textContent;
                const parentCommentNameElement = template.querySelector('.parent-comment-name');

                if (parentCommentNameElement) {
                    parentCommentNameElement.textContent = parentCommentElementName;
                } else {
                    console.error("Parent comment name element not found in the template.", template);
                }

                const repliesList = parentCommentElement.querySelector('.replies-list');
                if (repliesList) {
                    repliesList.appendChild(template);
                    if (replyButton) {
                        replyButton.style.display = 'none'; // Hide the reply button on replies
                    }
                } else {
                    console.error("Replies list not found in the parent comment element.", parentCommentElement);
                }
            } else {
                console.error(`Parent comment with id ${comment.parentId} not found.`, template);
            }
        }
    }

    toggleReplyForm(id) {
        const commentElement = document.querySelector(`.comment-template[data-id="${id}"]`);
        if (commentElement) {
            const replyForm = commentElement.querySelector('.reply-form');
            replyForm.style.display = replyForm.style.display === 'none' ? 'block' : 'none';
        } else {
            alert(`Comment with id ${id} not found.`);
        }
    }

    async reply(id) {
        const commentElement = document.querySelector(`.comment-template[data-id="${id}"]`);
        if (!commentElement) {
            alert(`Comment with id ${id} not found.`);
            return;
        }

        const replyText = commentElement.querySelector('.reply-text').value.trim();
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

        const newReply = new Comment({
            avatar: this.randomUser.picture.thumbnail,
            name: this.randomUser.name.first + ' ' + this.randomUser.name.last,
            text: replyText,
            date: new Date(),
            id: Date.now(),
            parentId: id,
            votes: 0,
            favorites: false,
            replyNumber: 0,
            voteColor: 'black'
        });

        this.saveComment(newReply);
        commentElement.querySelector('.reply-text').value = "";
        await this.refreshComments();
        await this.loadRandomUser();
    }

    updateCharCount() {
        const commentText = document.getElementById('new-comment-text').value;
        const charCount = commentText.length;
        const charCountDisplay = document.getElementById('char-count');
        const charWarning = document.getElementById('char-warning');
        const submitButton = document.querySelector('button.submit-button');

        charCountDisplay.textContent = `${charCount}/1000`;

        if (charCount > 1000) {
            charWarning.style.display = 'block';
            submitButton.disabled = true;
        } else {
            charWarning.style.display = 'none';
            submitButton.disabled = false;
        }
    }

    adjustTextareaHeight() {
        const textarea = document.getElementById('new-comment-text');
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    }

    async sortComments(field, order = 'asc') {
        if (field === 'date') {
            this.comments.sort((a, b) => order === 'asc' ? new Date(a.date) - new Date(b.date) : new Date(b.date) - new Date(a.date));
        } else if (field === 'votes') {
            this.comments.sort((a, b) => order === 'asc' ? a.votes - b.votes : b.votes - a.votes);
        }
        this.currentSort = { field, order };
        await this.refreshComments();
    }

    async upVote(id) {
        const comment = this.comments.find(comment => comment.id === id);
        if (comment) {
            comment.votes += 1;
            if (comment.votes > 0) {
                comment.voteColor = 'green';
            } else if (comment.votes === 0) {
                comment.voteColor = 'black';
            } else {
                comment.voteColor = 'red';
            }
            this.saveComment(comment);
            await this.refreshComments();
        }
    }

    async downVote(id) {
        const comment = this.comments.find(comment => comment.id === id);
        if (comment) {
            comment.votes -= 1;
            if (comment.votes > 0) {
                comment.voteColor = 'green';
            } else if (comment.votes === 0) {
                comment.voteColor = 'black';
            } else {
                comment.voteColor = 'red';
            }
            this.saveComment(comment);
            await this.refreshComments();
        }
    }

    async toggleFavorite(id) {
        const comment = this.comments.find(comment => comment.id === id);
        if (comment) {
            comment.favorites = !comment.favorites;
            this.saveComment(comment);
            await this.refreshComments();
        }
    }

    formatDate(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) {
            return 'Только что';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} мин. назад`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} час. назад`;
        } else {
            return date.toLocaleDateString();
        }
    }

    async refreshComments() {
        await this.loadComments();
        this.updateCommentCount();
    }

    filterComments(filter) {
        const comments = JSON.parse(localStorage.getItem('comments')) || [];
        let filteredComments;

        switch (filter) {
            case 'favorites':
                filteredComments = comments.filter(comment => comment.favorites);
                break;
            case 'high-rating':
                filteredComments = comments.filter(comment => comment.votes > 0);
                break;
            case 'low-rating':
                filteredComments = comments.filter(comment => comment.votes < 0);
                break;
            default:
                filteredComments = comments;
                break;
        }

        this.comments = filteredComments.map(comment => new Comment(comment));
        this.refreshComments();
    }
}
