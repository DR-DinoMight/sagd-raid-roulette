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
    nearestCountUsed?: number;
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

    const requestHeaders: Headers = new Headers({
        'Content-Type': 'application/json',
        'Client-ID': process.env.TWITCH_CLIENT_ID ?? '',
        'Authorization': `Bearer ${process.env.TWITCH_ACCESS_TOKEN}`
    });

    const response = await fetch(
        `https://api.twitch.tv/helix/streams?game_id=${category}&first=100`,
        {
            method: 'GET',
            headers: requestHeaders,
        }
    );

    const data = await response.json();
    // Search the data results for a stream with viewer_count less than or equal to minViewers and get a random stream
    let stream : Data = await data.data.filter(
        (stream: { viewer_count: string; }) => parseInt(stream.viewer_count) <= parseInt(minViewers)
    )[Math.floor(Math.random() * data.data.length)];

    //if stream is null then check data.data and get all the viewers with the lowest
    // viewer_count near the minViewers value and get a random stream
    if (!stream) {
        //order the data.data by viewer_count ascending
        const orderedData = data.data.sort((a: { viewer_count: string; }, b: { viewer_count: string; }) => {
            return parseInt(a.viewer_count) - parseInt(b.viewer_count);
        });
        // get all streams where the viewer_count equals the lowest viewer_count
        const streams = orderedData.filter(
            (stream: { viewer_count: string; }) => parseInt(stream.viewer_count) === parseInt(orderedData[0].viewer_count)
        );
        //get a random stream from the streams array
        stream = streams[Math.floor(Math.random() * streams.length)];
    }


    // If no stream is found, return an error
    if (!stream) {
        return res.status(404).json({
            error: 'No stream found',
        });
    }

    //get host from env file or fall back to hostname
    const hostname = process.env.HOST ?? (req.headers.host ?? 'localhost');
    const hostnameWithoutPort = hostname.split(':')[0];
    stream.stream_url = `https://player.twitch.tv/?channel=${stream.user_login}&parent=${hostnameWithoutPort}`;

    return res.status(200).json(stream);
}

