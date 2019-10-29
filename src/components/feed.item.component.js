import React from 'react';
import { FiHeart, FiMessageSquare } from 'react-icons/fi';
import { Box, Image, Badge, IconButton } from '@chakra-ui/core';

export const FeedItem = ({ item }) => {
	// const item = {
	// 	imageUrl: 'https://bit.ly/2Z4KKcF',
	// 	imageAlt: 'Rear view of modern home with pool',
	// 	beds: 3,
	// 	baths: 2,
	// 	title: 'Modern home in city center in the heart of historic Los Angeles',
	// 	formattedPrice: '$1,900.00',
	// 	reviewCount: 34,
	// 	rating: 4
	// };

	return (
		<Box maxW="sm" borderWidth="1px" rounded="lg" overflow="hidden">
			<Image src={`${item.imageURL}?i=${Math.random()*Date.now()}`} alt={item.imageAlt} />

			<Box p="6">
				<Box d="flex" alignItems="baseline">
					<Badge rounded="full" px="2" variantColor="teal">
						New
					</Badge>
					<Box
						color="gray.500"
						fontWeight="semibold"
						letterSpacing="wide"
						fontSize="xs"
						textTransform="uppercase"
						ml="2"
					>
						{item.uploader}
					</Box>
				</Box>

				<Box mt="1" fontWeight="semibold" as="h4" lineHeight="tight" isTruncated>
					{item.shortTitle}
				</Box>

				<Box d="flex" mt="2" alignItems="center">
                    <IconButton variantColor="red" aria-label="Like this post" icon={FiHeart} />
                    <IconButton variantColor="blue" aria-label="Leave a comment" icon={FiMessageSquare} />
				</Box>
			</Box>
		</Box>
	);
};
