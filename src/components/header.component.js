import React from 'react';
import { Flex, Icon, IconButton, Box, Image, Text, PseudoBox } from '@chakra-ui/core';
import { FiMenu, FiLogOut, FiSettings } from "react-icons/fi";
import { MdAccountCircle, MdTheaters } from "react-icons/md";
import {
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    MenuGroup,
    MenuDivider,
    MenuOptionGroup,
    MenuItemOption,
  } from "@chakra-ui/core";
import * as Logo from '../sketchel.png';


export const Header = () => {

    const [ searchClicked, searchOnClick ] = React.useState(false);

    return (
        <div className="header">
            <Flex 
                px="4"
                py="4"
                justify="space-between"
                borderBottomWidth={'1px'}
                backgroundColor={'white'}
                position={'fixed'}
                top={'0px'}
                width={'100%'}
            >

                <Flex align="start">
                    <IconButton isRound="true" aria-label="Menu" icon={FiMenu} fontSize="20px" />
                    <Text 
                        as="div"
                        fontSize="xl" 
                        height={'40px'}
                        lineHeight={'40px'}
                        fontFamily={'Montserrat'}
                        marginLeft={'15px'}
                    >Sketchel</Text>
                </Flex>

                {searchClicked == false && (
                    <Flex as="form" onClick={() => searchOnClick(true)}>
                        <PseudoBox
                            as="input"
                            placeholder="Search Sketchel"
                            type="text"
                            flex="1"
                            rounded="md"
                            width="300px"
                            bg="gray.100"
                            borderWidth="1px"
                            padding="0 8px"
                            _focus={{
                                outline: "none",
                                bg: "white",
                                boxShadow: "outline",
                                borderColor: "gray.300",
                            }}
                        />
                        <IconButton variantColor="blue" aria-label="Search database" icon="search" borderRadius="0 0.25rem 0.25rem 0" />
                    </Flex>
                )}
                {searchClicked == true && (
                    <Flex as="form" style={{
                        outline: "none",
                        boxShadow: "outline",
                        borderColor: "gray.300",
                        borderRadius: '0.25rem'
                    }} onClick={() => searchOnClick(true)}>
                        <PseudoBox
                            as="input"
                            placeholder="Search Sketchel"
                            type="text"
                            flex="1"
                            rounded="md"
                            width="300px"
                            bg="gray.100"
                            borderWidth="1px"
                            padding="0 8px"
                            _focus={{
                                outline: "none",
                                bg: "white",
                                boxShadow: "outline",
                                borderColor: "gray.300",
                            }}
                        />
                        <IconButton variantColor="blue" aria-label="Search database" icon="search" borderRadius="0 0.25rem 0.25rem 0" />
                    </Flex>
                )}

                <Flex align="end">
                    <Menu>
                        <MenuButton as={IconButton} rightIcon="chevron-down" isRound="true" aria-label="Search database" icon={MdAccountCircle} fontSize="25px">
                        </MenuButton>
                        <MenuList>
                            <MenuGroup title="Me">
                                <MenuItem><Box as={MdAccountCircle} size="18px" />&nbsp;&nbsp;Your profile</MenuItem>
                                <MenuItem><Box as={MdTheaters} size="18px" />&nbsp;&nbsp;Subscriptions</MenuItem>
                                <MenuItem><Box as={FiSettings} size="18px" />&nbsp;&nbsp;Settings</MenuItem>
                            </MenuGroup>
                            <MenuGroup title="Exit">
                                <MenuItem><Box as={FiLogOut} size="18px" />&nbsp;&nbsp;Sign out</MenuItem>
                            </MenuGroup>
                        </MenuList>
                    </Menu>
                </Flex>
            </Flex>
        </div>
    )
}