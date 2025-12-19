
const conf = {
    ProjectId: String(import.meta.env.VITE_APPWRITE_PROJECT_ID),
    AppwriteUrl: String(import.meta.env.VITE_APPWRITE_URL),
    BucketId: String(import.meta.env.VITE_BUCKET_ID),
    DatabaseId: String(import.meta.env.VITE_DATABASE_ID),
    TableId: String(import.meta.env.VITE_TABLE_ID)
}

export default conf