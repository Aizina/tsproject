"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comment = void 0;
class Comment {
    constructor({ avatar, name, text, date, id, votes, favorites, parentId, replyNumber, voteColor = 'black', }) {
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
exports.Comment = Comment;
