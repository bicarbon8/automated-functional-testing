export type JiraSearchResults = {
    expand?: string;
    issues: Array<JiraIssue>;
    maxResults?: number;
    startAt?: number;
    total?: number;
};

export type JiraCustomField = {
    self?: string;
    value?: string;
    id?: string;
};

export type JiraComment = {
    startAt?: number;
    maxResults?: number;
    total?: number;
    comments?: Array<{}>;
};

export type JiraStatusCategory = {
    self?: string;
    id?: string;
    key?: string;
    name?: string;
};

export type JiraStatus = {
    self?: string;
    description?: string;
    iconUrl?: string;
    name?: string;
    id?: string;
    statusCategory?: JiraStatusCategory;
};

export type JiraFields = {
    summary?: string;
    timespent?: {};
    customfield_11800?: {};
    created?: string;
    updated?: string;
    description?: string;
    customfield_10001?: {};
    customfield_10002?: {};
    customfield_10004?: string;
    issuelinks?: Array<{}>;
    customfield_10000?: {};
    subtasks?: Array<{}>;
    status?: JiraStatus;
    customfield_10005?: {};
    labels?: Array<{}>;
    workratio?: number;
    customfield_11200?: {};
    customfield_11603?: {};
    lastViewed?: string;
    customfield_11600?: {};
    customfield_11300?: {};
    customfield_11601?: {};
    comment?: JiraComment;
    timeoriginalestimate?: {};
    customfield_10900?: {};
    customfield_10402?: {};
    customfield_10401?: {};
    customfield_11100?: string;
    resolution?: {};
    resolutiondate?: {};
    aggregatetimeoriginalestimate?: {};
    customfield_11002?: {};
    customfield_11004?: {};
    duedate?: {};
    customfield_10600?: {};
    customfield_10100?: {};
    customfield_10508?: {};
    customfield_10506?: JiraCustomField;
    attachment?: Array<{}>;
    aggregatetimeestimate?: {};
    customfield_10400?: {};
    timeestimate?: {};
    aggregatetimespent?: {};
};

export type JiraIssue = {
    expand?: string;
    id?: string;
    self?: string;
    key?: string;
    fields?: JiraFields;
};
