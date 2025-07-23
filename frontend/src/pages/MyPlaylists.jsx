import React from 'react'
import CreateUserPlaylistForm from '../components/dashboard/CreateUserPlaylistForm'
import UserPlaylistsSection from '../components/dashboard/UserPlaylistsSection'

const MyPlaylists = () => {
  return (
    <div>
    <CreateUserPlaylistForm/>
    <UserPlaylistsSection/>
    </div>
  )
}

export default MyPlaylists