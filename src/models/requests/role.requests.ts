export interface IUpsertRole {
    role_name: string
    role_description: string
    role_grant: Array<{
        resources: string
        actions: string
    }>
    role_status?: string
}