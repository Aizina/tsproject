import { User } from './user';
import { Comment } from './comment';

interface SortOption {
    field: 'date' | 'votes';
    order: 'asc' | 'desc';
}

export class CommentSystem {
    public user: User;
    public comments: Comment[];
    public currentSort: SortOption;
    public randomUser: any | null;

    constructor() {
        this.user = new User();
        this.comments = this.loadCommentsFromStorage();
        this.currentSort = { field: 'date', order: 'asc' };
        this.randomUser = null;
    }

    public loadCommentsFromStorage(): Comment[] {
        const comments = JSON.parse(localStorage.getItem('comments') || '[]');
        return comments.map((comment: any) => new Comment(comment));
    }

    public saveCommentsToStorage(): void {
        localStorage.setItem('comments', JSON.stringify(this.comments));
    }

    public updateCommentCount(): void {
        const commentAmountElement = document.getElementById('comment-amount');
        const comments = JSON.parse(localStorage.getItem('comments') || '[]');
        const commentCount = comments.length;
        if (commentAmountElement) {
            commentAmountElement.textContent = `(${commentCount})`;
        }
    }

    public async loadRandomUser(): Promise<void> {
        try {
            this.randomUser = await this.user.fetchRandomUser();
        } catch (error) {
            console.error('Ошибка при загрузке пользователя:', error);
            this.randomUser = null;
        }

        if (this.randomUser) {
            const userAvatar = document.getElementById('main-user-avatar') as HTMLImageElement;
            if (userAvatar) {
                userAvatar.src = this.randomUser.picture?.thumbnail || '';
            }
            const mainUserName = document.getElementById('main-user-name');
            if (mainUserName) {
                mainUserName.textContent = `${this.randomUser.name?.first || 'Неизвестный'} ${this.randomUser.name?.last || 'Пользователь'}`;
            }
        } else {
            alert("Не удалось загрузить данные пользователя. Пожалуйста, перезагрузите страницу.");
        }
    }

    public async addComment(): Promise<void> {
        const commentTextElement = document.getElementById('new-comment-text') as HTMLTextAreaElement;
        if (!commentTextElement) return;
        
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
            avatar: this.randomUser.picture?.thumbnail || '',
            name: `${this.randomUser.name?.first || 'Неизвестный'} ${this.randomUser.name?.last || 'Пользователь'}`,
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

    public saveComment(comment: Comment): void {
        this.comments = this.comments.filter(c => c.id !== comment.id);
        this.comments.push(comment);
        this.saveCommentsToStorage();
    }

    public async loadComments(): Promise<void> {
        const commentsListElement = document.getElementById('comments-list');
        if (commentsListElement) {
            commentsListElement.innerHTML = '';
            this.comments.forEach(comment => this.displayComment(comment));
        }
    }

    public displayComment(comment: Comment): void {
        const existingComment = document.querySelector(`.comment-template[data-id="${comment.id}"], .reply-template[data-id="${comment.id}"]`);
        if (existingComment) return;

        const template = comment.parentId === null
            ? (document.querySelector('.comment-template') as HTMLDivElement).cloneNode(true) as HTMLDivElement
            : (document.querySelector('.reply-template') as HTMLDivElement).cloneNode(true) as HTMLDivElement;

        template.style.display = 'block';
        template.setAttribute('data-id', comment.id.toString());
        const userAvatar = template.querySelector('.user-avatar') as HTMLImageElement;
        if (userAvatar) userAvatar.src = comment.avatar;

        const userName = template.querySelector('.user-name');
        if (userName) userName.textContent = comment.name;

        const commentText = template.querySelector('.comment-text');
        if (commentText) commentText.textContent = comment.text;

        const commentDate = template.querySelector('.comment-date');
        if (commentDate) commentDate.textContent = this.formatDate(comment.date);

        const voteRating = template.querySelector('.vote-rating') as HTMLElement | null;
        if (voteRating) {
            voteRating.textContent = comment.votes.toString();
            voteRating.style.color = comment.voteColor || 'black';
        }
        

        const upvoteButton = template.querySelector('.upvote-button');
        if (upvoteButton) upvoteButton.addEventListener('click', () => this.upVote(comment.id));

        const downvoteButton = template.querySelector('.downvote-button');
        if (downvoteButton) downvoteButton.addEventListener('click', () => this.downVote(comment.id));

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
            if (repliesList) repliesList.innerHTML = "";
        } else {
            const parentCommentElement = document.querySelector(`.comment-template[data-id="${comment.parentId}"]`) as HTMLDivElement;
            if (parentCommentElement) {
                const parentCommentName = parentCommentElement.querySelector('.user-name')?.textContent;
                const parentCommentNameElement = template.querySelector('.parent-comment-name');
                if (parentCommentNameElement) {
                    parentCommentNameElement.textContent = parentCommentName || '';
                } else {
                    console.error("Parent comment name element not found in the template.", template);
                }

                const repliesList = parentCommentElement.querySelector('.replies-list') as HTMLElement | null;
                if (repliesList) {
                    repliesList.appendChild(template);

                    if (replyButton) {
                        (replyButton as HTMLElement).style.display = 'none'; // Hide the reply button on replies
                    } else {
                    console.error("Replies list not found in the parent comment element.", parentCommentElement);
                    }
                } else {
                console.error(`Parent comment with id ${comment.parentId} not found.`, template);
                }
            }
        }
    }

    public toggleReplyForm(id: number): void {
        const commentElement = document.querySelector(`.comment-template[data-id="${id}"]`) as HTMLDivElement | null;
        if (commentElement) {
            const replyForm = commentElement.querySelector('.reply-form') as HTMLDivElement | null;
            if (replyForm) {
                replyForm.style.display = replyForm.style.display === 'none' ? 'block' : 'none';
            }
        } else {
            alert(`Comment with id ${id} not found.`);
        }
    }
    
    public adjustTextareaHeight(): void {
        const textarea = document.getElementById('new-comment-text') as HTMLTextAreaElement | null;
        if (!textarea) return;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    }
    

    public async reply(id: number): Promise<void> {
        const commentElement = document.querySelector(`.comment-template[data-id="${id}"]`) as HTMLDivElement;
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
            avatar: this.randomUser.picture?.thumbnail || '',
            name: `${this.randomUser.name?.first || 'Неизвестный'} ${this.randomUser.name?.last || 'Пользователь'}`,
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
        await this.refreshComments();
        await this.loadRandomUser();
    }

    public updateCharCount(): void {
        const commentTextElement = document.getElementById('new-comment-text') as HTMLTextAreaElement;
        if (!commentTextElement) return;
        const charCount = commentTextElement.value.length;

        const charCountDisplay = document.getElementById('char-count');
        const charWarning = document.getElementById('char-warning');
        const submitButton = document.querySelector('button.submit-button') as HTMLButtonElement;

        if (charCountDisplay) {
            charCountDisplay.textContent = `${charCount}/1000`;
        }

        if (charCount > 1000) {
            if (charWarning) charWarning.style.display = 'block';
            if (submitButton) submitButton.disabled = true;
        } else {
            if (charWarning) charWarning.style.display = 'none';
            if (submitButton) submitButton.disabled = false;
        }
    }


    public async sortComments(field: 'date' | 'votes', order: 'asc' | 'desc' = 'asc'): Promise<void> {
        if (field === 'date') {
            this.comments.sort((a, b) => order === 'asc' ? new Date(a.date).getTime() - new Date(b.date).getTime() : new Date(b.date).getTime() - new Date(a.date).getTime());
        } else if (field === 'votes') {
            this.comments.sort((a, b) => order === 'asc' ? a.votes - b.votes : b.votes - a.votes);
        }
        this.currentSort = { field, order };
        await this.refreshComments();
    }

    public async upVote(id: number): Promise<void> {
        const comment = this.comments.find(comment => comment.id === id);
        if (comment) {
            comment.votes += 1;
            comment.voteColor = comment.votes > 0 ? 'green' : comment.votes === 0 ? 'black' : 'red';
            this.saveComment(comment);
            await this.refreshComments();
        }
    }

    public async downVote(id: number): Promise<void> {
        const comment = this.comments.find(comment => comment.id === id);
        if (comment) {
            comment.votes -= 1;
            comment.voteColor = comment.votes > 0 ? 'green' : comment.votes === 0 ? 'black' : 'red';
            this.saveComment(comment);
            await this.refreshComments();
        }
    }

    public async toggleFavorite(id: number): Promise<void> {
        const comment = this.comments.find(comment => comment.id === id);
        if (comment) {
            comment.favorites = !comment.favorites;
            this.saveComment(comment);
            await this.refreshComments();
        }
    }

    public formatDate(date: Date): string {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

        if (diffInSeconds < 60) {
            return 'Только что';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} мин. назад`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} час. назад`;
        } else {
            return new Date(date).toLocaleDateString();
        }
    }

    public async refreshComments(): Promise<void> {
        await this.loadComments();
        this.updateCommentCount();
    }

    public filterComments(filter: 'favorites' | 'high-rating' | 'low-rating' | 'all'): void {
        const comments = JSON.parse(localStorage.getItem('comments') || '[]');
        let filteredComments;

        switch (filter) {
            case 'favorites':
                filteredComments = comments.filter((comment: Comment) => comment.favorites);
                break;
            case 'high-rating':
                filteredComments = comments.filter((comment: Comment) => comment.votes > 0);
                break;
            case 'low-rating':
                filteredComments = comments.filter((comment: Comment) => comment.votes < 0);
                break;
            default:
                filteredComments = comments;
                break;
        }

        this.comments = filteredComments.map((comment: any) => new Comment(comment));
        this.refreshComments();
    }
}
