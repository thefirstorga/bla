import React, { useContext, useState } from 'react'
import { UserContext } from '../components/UserContext'
import { Link, Navigate, useParams } from 'react-router-dom'
import axios from 'axios'
import PlacesPage from './PlacesPage'
import AccountNav from '../components/AccountNav'

function ProfilePage() {
  const [redirect, setRedirect] = useState(null)
  const {ready, user, setUser} = useContext(UserContext)
  let {subpage} = useParams()
  if(subpage === undefined) {subpage = 'profile'}
  
  async function logout() {
    await axios.post('/auth/logout')
    setRedirect('/')
    setUser(null)
  }

  if(!ready) return 'Loading...'

  if(ready && !user && !redirect) {
    return <Navigate to={'/login'}/>
  }

  

  if(redirect) return <Navigate to={redirect}/>

  return (
    <div>
      <AccountNav />

      {subpage === 'profile' && (
        <div className='text-center max-w-lg mx-auto'>
          Logged in as {user.name}
          <button onClick={logout} className='primary max-w-sm mt-2'>Logout</button>
        </div>
      )}

      {subpage === 'places' && (
        <div>
          <PlacesPage />
        </div>
      )}
    </div>
  )
}

export default ProfilePage