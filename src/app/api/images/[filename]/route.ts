import {NextRequest, NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {promises as fs} from 'fs';
import path from 'path';

// Use Railway volume path if available, fallback to local for development
const UPLOAD_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH 
    ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'expenses')
    : path.join(process.cwd(), 'public', 'uploads', 'expenses');

export async function GET(
    request: NextRequest,
    {params}: { params: Promise<{ filename: string }> }
) {
    try {
        // Get the session cookie for authentication
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('user_session');

        if (!sessionCookie) {
            return NextResponse.json(
                {error: 'No active session'},
                {status: 401}
            );
        }

        const { filename } = await params;
        
        // Validate filename to prevent directory traversal
        if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return NextResponse.json(
                {error: 'Invalid filename'},
                {status: 400}
            );
        }

        const filePath = path.join(UPLOAD_DIR, filename);

        try {
            const fileBuffer = await fs.readFile(filePath);
            
            // Determine content type based on file extension
            const ext = path.extname(filename).toLowerCase();
            let contentType = 'application/octet-stream';
            
            switch (ext) {
                case '.jpg':
                case '.jpeg':
                    contentType = 'image/jpeg';
                    break;
                case '.png':
                    contentType = 'image/png';
                    break;
                case '.gif':
                    contentType = 'image/gif';
                    break;
                case '.webp':
                    contentType = 'image/webp';
                    break;
            }

            return new NextResponse(fileBuffer, {
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
                },
            });
        } catch (fileError) {
            return NextResponse.json(
                {error: 'File not found'},
                {status: 404}
            );
        }
    } catch (error) {
        console.error('Error serving image:', error);
        return NextResponse.json(
            {error: 'Failed to serve image'},
            {status: 500}
        );
    }
}