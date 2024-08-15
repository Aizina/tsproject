interface CommentParams {
    avatar: string;
    name: string;
    text: string;
    date: Date | string;
    id: number;
    votes: number;
    favorites: boolean;
    parentId: number | null;
    replyNumber: number;
    voteColor?: string;
}

export class Comment {
    avatar: string;
    name: string;
    text: string;
    date: Date;
    id: number;
    votes: number;
    favorites: boolean;
    parentId: number | null;
    replyNumber: number;
    voteColor: string;

    constructor({
        avatar,
        name,
        text,
        date,
        id,
        votes,
        favorites,
        parentId,
        replyNumber,
        voteColor = 'black',
    }: CommentParams) {
        this.avatar = avatar;
        this.name = name;
        this.text = text;
        this.date = date instanceof Date ? date : new Date(date);
        this.id = id;
        this.votes = votes;
        this.favorites = favorites;
        this.parentId = parentId;
        this.replyNumber = replyNumber;
        this.voteColor = voteColor;
    }
}
