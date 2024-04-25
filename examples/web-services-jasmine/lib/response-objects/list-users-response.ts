import { User } from "./user";

export type ListUsersResponse = {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    data: User[];
};