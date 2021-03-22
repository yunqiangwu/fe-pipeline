


declare module entity {


    export interface Namespace {
        id: number;
        name: string;
        path: string;
        kind: string;
        full_path: string;
        parent_id?: any;
    }

    export interface GitLabRepos {
        id: number;
        description?: string | null;
        name: string;
        name_with_namespace: string;
        path: string;
        path_with_namespace: string;
        created_at: string;
        default_branch: string;
        tag_list: any[];
        ssh_url_to_repo: string;
        http_url_to_repo: string;
        web_url: string;
        readme_url: string;
        avatar_url?: any;
        star_count: number;
        forks_count: number;
        last_activity_at: string;
        namespace: Namespace;
    }

}

