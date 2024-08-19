import { User } from './user.js';
import { RandomUser } from './user.js';
import { Comment } from './comment.js';

interface SortOption {
    field: string;
    order: 'asc' | 'desc';
}

export class CommentSystem {
    user: User;
    comments: Comment[];
    currentSort: SortOption;
    randomUser: RandomUser | null;

    constructor() {
        this.user = new User();
        this.comments = this.loadCommentsFromStorage();
        this.currentSort = { field: 'date', order: 'asc' };
        this.randomUser = null;
    }

    loadCommentsFromStorage(): Comment[] {
        const comments = JSON.parse(localStorage.getItem('comments') || '[]');
        return comments.map((comment: Comment) => new Comment(comment));
    }

    saveCommentsToStorage(): void {
        localStorage.setItem('comments', JSON.stringify(this.comments));
    }

    updateCommentCount(): void {
        const commentAmountElement = document.getElementById('comment-amount');
        const comments = JSON.parse(localStorage.getItem('comments') || '[]');
        const commentCount = comments.length;
        if (commentAmountElement) {
            commentAmountElement.textContent = `(${commentCount})`;
        }
    }

    async loadRandomUser(): Promise<void> {
        this.randomUser = await this.user.fetchRandomUser();
        if (this.randomUser) {
            const userAvatar = document.getElementById('main-user-avatar') as HTMLImageElement;
            const mainUserName = document.getElementById('main-user-name');
            if (userAvatar && mainUserName) {
                userAvatar.src = this.randomUser.picture.thumbnail;
                mainUserName.textContent = `${this.randomUser.name.first} ${this.randomUser.name.last}`;
            }
        } else {
            alert("Не удалось загрузить данные пользователя. Пожалуйста, перезагрузите страницу.");
        }
    }

    async addComment(): Promise<void> {
        const commentTextElement = document.getElementById('new-comment-text') as HTMLTextAreaElement;
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

        const newComment = new Comment({
            avatar: this.randomUser.picture.thumbnail,
            name: `${this.randomUser.name.first} ${this.randomUser.name.last}`,
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
        await this.refreshComments();
        await this.loadRandomUser();
    }

    saveComment(comment: Comment): void {
        this.comments = this.comments.filter(c => c.id !== comment.id);
        this.comments.push(comment);
        this.saveCommentsToStorage();
    }

    async loadComments(): Promise<void> {
        document.getElementById('comments-list')!.innerHTML = '';
        this.comments.forEach(comment => this.displayComment(comment));
    }

    displayComment(comment: Comment): void {
        const existingComment = document.querySelector(`.comment-template[data-id="${comment.id}"], .reply-template[data-id="${comment.id}"]`);
        if (existingComment) {
            return;
        }

        const template = comment.parentId === null
            ? document.querySelector('.comment-template')!.cloneNode(true) as HTMLElement
            : document.querySelector('.reply-template')!.cloneNode(true) as HTMLElement;

        template.style.display = 'block';
        template.setAttribute('data-id', comment.id.toString());
        const userAvatar = template.querySelector('.user-avatar') as HTMLImageElement;
        const userName = template.querySelector('.user-name');
        const commentText = template.querySelector('.comment-text');
        const commentDate = template.querySelector('.comment-date');
        const voteRating = template.querySelector('.vote-rating');
        const upvoteButton = template.querySelector('.upvote-button');
        const downvoteButton = template.querySelector('.downvote-button');

        if (userAvatar && userName && commentText && commentDate && voteRating && upvoteButton && downvoteButton) {
            userAvatar.src = comment.avatar;
            userName.textContent = comment.name;
            commentText.textContent = comment.text;
            commentDate.textContent = this.formatDate(comment.date);
            const voteRating = document.querySelector('.vote-rating') as HTMLElement;
            voteRating.style.color = comment.voteColor || 'black';
            voteRating.textContent = comment.votes.toString();
            upvoteButton.addEventListener('click', () => this.upVote(comment.id));
            downvoteButton.addEventListener('click', () => this.downVote(comment.id));
        }

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

        if (comment.parentId === null) {
            document.getElementById('comments-list')!.appendChild(template);
            document.querySelector(`.comment-template[data-id="${comment.id}"] .replies-list`)!.innerHTML = "";
        } else {
            const parentCommentElement = document.querySelector(`.comment-template[data-id="${comment.parentId}"]`) as HTMLElement;
            if (parentCommentElement) {
                const parentCommentElementName = parentCommentElement.querySelector('.user-name')?.textContent;
                const parentCommentNameElement = template.querySelector('.parent-comment-name');

                if (parentCommentNameElement) {
                    parentCommentNameElement.textContent = parentCommentElementName || '';
                }

                const repliesList = parentCommentElement.querySelector('.replies-list') as HTMLElement;
                if (repliesList) {
                    repliesList.appendChild(template);
                    
                    if (replyButton) {
                        const replyButtonElement = replyButton as HTMLElement;
                        replyButtonElement.style.display = 'none'; // Hide the reply button on replies
                    }
                }

            }
        }
    }

    toggleReplyForm(id: number): void {
        const commentElement = document.querySelector(`.comment-template[data-id="${id}"]`) as HTMLElement;
        if (commentElement) {
            const replyForm = commentElement.querySelector('.reply-form') as HTMLElement;
            if (replyForm) {
                replyForm.style.display = replyForm.style.display === 'none' ? 'block' : 'none';
            }
        } else {
            alert(`Comment with id ${id} not found.`);
        }
    }

    async reply(id: number): Promise<void> {
        const commentElement = document.querySelector(`.comment-template[data-id="${id}"]`) as HTMLElement;
        if (!commentElement) {
            alert(`Comment with id ${id} not found.`);
            return;
        }

        const replyTextElement = commentElement.querySelector('.reply-text') as HTMLTextAreaElement;
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

        const newReply = new Comment({
            avatar: this.randomUser.picture.thumbnail,
            name: `${this.randomUser.name.first} ${this.randomUser.name.last}`,
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
        replyTextElement.value = "";
        await this.refreshComments();
        await this.loadRandomUser();
    }

    updateCharCount(): void {
        const commentTextElement = document.getElementById('new-comment-text') as HTMLTextAreaElement;
        const charCount = commentTextElement.value.length;
        const charCountDisplay = document.getElementById('char-count');
        const charWarning = document.getElementById('char-warning');
        const submitButton = document.getElementById('submit-comment') as HTMLButtonElement;

        if (charCountDisplay) {
            charCountDisplay.textContent = `${charCount} / 1000`;
        }

        if (charCount > 1000) {
            if (charWarning) {
                charWarning.style.display = 'block';
            }
            if (submitButton) {
                submitButton.disabled = true;
            }
        } else {
            if (charWarning) {
                charWarning.style.display = 'none';
            }
            if (submitButton) {
                submitButton.style.background = '#ABD873';
                submitButton.style.opacity = '1';
                submitButton.disabled = false;
            }
        }
    }

    upVote(id: number): void {
        const comment = this.comments.find(c => c.id === id);

        if (comment) {
            comment.votes++;
            comment.voteColor = comment.votes > 0 ? '#8AC540' : comment.votes < 0 ? '#FF0000' : 'black';
            this.saveCommentsToStorage();
            this.refreshComments();
        }
    }

    downVote(id: number): void {
        const comment = this.comments.find(c => c.id === id);
        if (comment) {
            comment.votes--;
            comment.voteColor = comment.votes > 0 ? '#8AC540' : comment.votes < 0 ? '#FF0000' : 'black';
            this.saveCommentsToStorage();
            this.refreshComments();
        }
    }

    toggleFavorite(id: number): void {
        const comment = this.comments.find(c => c.id === id);
        if (comment) {
            comment.favorites = !comment.favorites;
            this.saveCommentsToStorage();
            this.refreshComments();
        }
    }

    sortComments(field: string, order: 'asc' | 'desc'): void {
        this.comments.sort((a, b) => {
            if (field === 'date' || field === 'relevance') {
                return order === 'asc' ? new Date(a.date).getTime() - new Date(b.date).getTime() : new Date(b.date).getTime() - new Date(a.date).getTime();
            }
            if (field === 'rating') {
                return order === 'asc' ? a.votes - b.votes : b.votes - a.votes;
            }
            if (field === 'replies') {
                const repliesA = this.comments.filter(comment => comment.parentId === a.id).length;
                const repliesB = this.comments.filter(comment => comment.parentId === b.id).length;
                return order === 'asc' ? repliesA - repliesB : repliesB - repliesA;
            }
            return 0;
        });

        this.refreshComments();
    }

    filterFavorites(): void {
        const favorites = this.comments.filter(comment => comment.favorites);
        document.getElementById('comments-list')!.innerHTML = '';
        favorites.forEach(comment => this.displayComment(comment));
    }

    async refreshComments(): Promise<void> {
        document.getElementById('comments-list')!.innerHTML = '';
        const parentComments = this.comments.filter(comment => comment.parentId === null);
        const replies = this.comments.filter(comment => comment.parentId !== null);

        parentComments.forEach(parent => {
            this.displayComment(parent);
            const childComments = replies.filter(reply => reply.parentId === parent.id);
            childComments.forEach(reply => this.displayComment(reply));
        });
    }

    formatDate(date: Date | string): string {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${day}.${month} ${hours}:${minutes}`;
    }

    addSortEventListeners(): void {
        const selectedOptionElement = document.getElementById('selected-option');
        const optionsContainer = document.getElementById('options');
        const options = document.querySelectorAll('.option');
        const sortButtonElement = document.querySelector('.sort-button');
        const favoritesToggleElement = document.getElementById('favorites-toggle');

        if (selectedOptionElement && optionsContainer && options.length) {
            selectedOptionElement.addEventListener('click', () => {
                optionsContainer.style.display = optionsContainer.style.display === 'block' ? 'none' : 'block';
            });

            options.forEach(option => {
                option.addEventListener('click', () => {
                    const selectedValue = option.getAttribute('data-value');
                    if (selectedOptionElement && selectedValue) {
                        selectedOptionElement.textContent = option.textContent;
                        optionsContainer.style.display = 'none';
                        this.currentSort.field = selectedValue;
                        this.sortComments(this.currentSort.field, this.currentSort.order);
                        options.forEach(opt => opt.classList.remove('selected'));
                        option.classList.add('selected');
                    }
                });
            });

            document.addEventListener('click', (event) => {
                if (!document.querySelector('.dropdown')!.contains(event.target as Node)) {
                    optionsContainer.style.display = 'none';
                }
            });
        } else {
            console.error("Dropdown elements not found.");
        }

        if (sortButtonElement) {
            sortButtonElement.addEventListener('click', () => {
                if (sortButtonElement.classList.contains('asc')) {
                    this.currentSort.order = 'asc';
                    this.sortComments(this.currentSort.field, this.currentSort.order);
                    sortButtonElement.classList.remove('asc');
                    sortButtonElement.classList.add('desc');
                } else {
                    this.currentSort.order = 'desc';
                    this.sortComments(this.currentSort.field, this.currentSort.order);
                    sortButtonElement.classList.remove('desc');
                    sortButtonElement.classList.add('asc');
                }
            });
        } else {
            console.error("Element '.sort-button' not found.");
        }

        if (favoritesToggleElement) {
            favoritesToggleElement.addEventListener('click', () => this.filterFavorites());
        } else {
            console.error("Element 'favorites-toggle' not found.");
        }
    }

    adjustTextareaHeight(): void {
        const textarea = document.getElementById('new-comment-text') as HTMLTextAreaElement;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    }
}

