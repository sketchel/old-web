import React from 'react';
import { FeedItem } from './feed.item.component';

const items = [{
    imageURL: `https://loremflickr.com/${Math.round(Math.random()*1000)*597}/${Math.round(Math.random()*500)*554}`,
    imageAlt: 'Random kitten',
    uploader: 'EnderDev',
    shortTitle: 'A little 🐈 cat picture',
    longTitle: 'I made this cat picture, featuring my cat Lorum Ipsum! Very awesome guys!',
},
{
    imageURL: `https://loremflickr.com/${Math.round(Math.random()*1000)*533}/${Math.round(Math.random()*500)*579}`,
    imageAlt: 'Random kitten',
    uploader: 'EnderDev',
    shortTitle: 'A little 🐈 cat picture',
    longTitle: 'I made this cat picture, featuring my cat Lorum Ipsum! Very awesome guys!',
},
{
    imageURL: `https://loremflickr.com/${Math.round(Math.random()*1000)*556}/${Math.round(Math.random()*500)*558}`,
    imageAlt: 'Random kitten',
    uploader: 'EnderDev',
    shortTitle: 'A little 🐈 cat picture',
    longTitle: 'I made this cat picture, featuring my cat Lorum Ipsum! Very awesome guys!',
},
];

export const Feed = () => {
    return (
        <div className="feed">
            <div class="column">
                {items.map(item => (
                    <FeedItem item={item}></FeedItem>
                ))}
            </div>
            <div class="column">
                {items.map(item => (
                    <FeedItem item={item}></FeedItem>
                ))}
            </div>  
            <div class="column">
                {items.map(item => (
                    <FeedItem item={item}></FeedItem>
                ))}
            </div>
            <div class="column">
                {items.map(item => (
                    <FeedItem item={item}></FeedItem>
                ))}
            </div>
        </div>
    )
}