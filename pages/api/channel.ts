import { request } from 'http';
import type { NextApiRequest, NextApiResponse } from 'next';

export type Data = {
    id?: string;
    user_id?: string;
    user_login?: string;
    user_name?: string;
    game_name?: string;
    title?: string;
    viewer_count?: number;
    started_at?: string;
    thumbnail_url?: string;
    is_mature?: boolean;
    stream_url?: string;
    error?: string;
};

//type for request params
type Params = {
    category: string;
    minViewers: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    const { category = '1469308723' , minViewers = '10' } = req.query as Params;

    //Game Development id = 1469308723

    const requestHeaders: HeadersInit = new Headers();
    requestHeaders.append('Content-Type', 'application/json');
    //add Client id
    requestHeaders.append('Client-ID', process.env.TWITCH_CLIENT_ID ?? '');
    //add bearer token
    requestHeaders.append('Authorization', `Bearer ${process.env.TWITCH_ACCESS_TOKEN}`);

    const results = await fetch(
        `https://api.twitch.tv/helix/streams?game_id=${category}&first=100`,
        {
            method: 'GET',
            headers: requestHeaders,
        }
    );
    const data = await results.json();
    // Search the data results for a stream with viewer_count less than or equal to minViewers and get a random stream

    let stream : Data = data.data.filter(
        (stream: { viewer_count: string; }) => parseInt(stream.viewer_count) <= parseInt(minViewers)
    )[Math.floor(Math.random() * data.data.length)];

    // If no stream is found, return an error
    if (!stream) {
        res.status(404).json({
            error: 'No stream found',
        });
    }


    stream.stream_url = `https://player.twitch.tv/?channel=${stream.user_login}&parent=localhost`;

    res.status(200).json(stream);
}

