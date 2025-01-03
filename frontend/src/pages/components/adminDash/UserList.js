import React, { useState } from 'react';
import { apiUrl } from '../../../config/config';
import { FaDiscord } from 'react-icons/fa';
import axios from 'axios';

const UserList = ({ users, admins, clipTeam, editors, uploader, fetchUsers, disabledUsers, setDisabledUsers, AVAILABLE_ROLES }) => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editUser, setEditUser] = useState(null);
  const usersPerPage = 15;
  

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value.toLowerCase());
    setCurrentPage(1);
  };

  const toggleEditUser = (user) => {
    if (editUser && editUser._id === user._id) {
      setEditUser(null);
    } else {
      setEditUser({ ...user, roles: user.roles || ['user'] });
    }
  };


  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'roles') {
      let updatedRoles = [...editUser.roles];
      if (checked) {
        updatedRoles.push(value);
      } else {
        updatedRoles = updatedRoles.filter(role => role !== value);
      }
      setEditUser({
        ...editUser,
        roles: updatedRoles
      });
    } else {
      setEditUser({
        ...editUser,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const handleDisableUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${apiUrl}/api/users/disable`, { userId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDisabledUsers(disabledUsers.filter(user => user._id !== userId));
      fetchUsers();
    } catch (error) {
      console.error('Error disabling user:', error);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const dataToSubmit = { ...editUser };

      if (!dataToSubmit.password) {
        delete dataToSubmit.password;
      }

      await axios.put(`${apiUrl}/api/admin/users/${editUser._id}`, dataToSubmit, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditUser(null);
      alert('User updated successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user. Please try again.');
    }
  };

  const combinedUsers = Array.from(new Map(users.concat(admins, clipTeam, editors, uploader).map(user => [user._id, user])).values()).filter(user => user);
  
  const filteredUsers = combinedUsers.filter(user => {
    if (filter !== 'all' && !user.roles.includes(filter)) return false;
    if (search && !user.username.toLowerCase().includes(search)) return false;
    return true;
  });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  return (
    <div className="col-span-1 md:col-span-2 lg:col-span-3 p-8 bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 rounded-md shadow-md animate-fade animate-delay-100">
      <h2 className="text-3xl font-bold mb-4">All Users</h2>
      <div className="mb-4 flex justify-end space-x-4">
        <div>
          <input
            type="text"
            placeholder='Search...'
            value={search}
            onChange={handleSearchChange}
            className="px-3 py-2 bg-white dark:bg-neutral-900 dark:text-white text-neutral-900 rounded-md focus:outline-none focus:bg-neutral-200 dark:focus:bg-neutral-700"
          />
        </div>
        <div>
          <select
            value={filter}
            onChange={handleFilterChange}
            className="px-3 py-2 bg-white dark:bg-neutral-900 dark:text-white text-neutral-900 rounded-md focus:outline-none focus:bg-neutral-200 dark:focus:bg-neutral-700"
          >
            <option value="all">All Users</option>
            {[...AVAILABLE_ROLES].sort().map(role => (
              <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {!currentUsers.length ? (
          <div className="col-span-full text-center text-white">No results found.</div>
        ) : (
          currentUsers
          .sort((a, b) => a.username.localeCompare(b.username))
          .map(user => (
            <div
              key={user._id}
              className={`relative bg-neutral-900 p-4 w-full min-h-28 rounded-lg hover:bg-neutral-950 transition-all duration-300 overflow-hidden ${editUser && editUser._id === user._id ? 'max-h-screen' : 'max-h-28'}`}
              style={{ transition: 'max-height 0.3s ease-in-out' }}
            >
              <div
                className="absolute inset-0 bg-cover bg-center filter blur-sm"
                style={{
                  backgroundImage: `url(${user.profilePicture})`,
                }}
              ></div>
              <div className="absolute inset-0 bg-black opacity-50 rounded-lg"></div>
              <div className="relative z-10 justify-between flex items-center">
                <div className='flex-col items-center'>
                  <p className="flex items-center text-white">{user.username}
                    <FaDiscord className="ml-2" style={{ color: user.discordId ? '#7289da' : '#747f8d' }} />
                  </p>
                  <p className="text-neutral-300">{[...user.roles].sort().map(role => role.charAt(0).toUpperCase() + role.slice(1)).join(', ')}</p>
                </div>
                <div className="flex flex-col justify-end items-end space-y-2">
                  <button
                    onClick={() => toggleEditUser(user)}
                    className="bg-blue-500/50 hover:bg-blue-600 backdrop-blur-2xl text-white font-bold py-1 px-2 rounded-md transition duration-200"
                  >
                    {editUser && editUser._id === user._id ? 'Cancel' : 'Edit'}
                  </button>
                  <button
                    onClick={() => handleDisableUser(user._id)}
                    className="bg-red-500/50 hover:bg-red-600 backdrop-blur-2xl text-white font-bold py-1 px-2 rounded-md transition duration-200"
                  >
                    Disable
                  </button>
                </div>
              </div>
              <div className={`transition-transform duration-300 ${editUser && editUser._id === user._id ? 'scale-y-100' : 'scale-y-0'} origin-top`}>
                {editUser && editUser._id === user._id && (
                  <div className="max-w-md w-full bg-black/20 p-4 mt-2 rounded-md shadow-md backdrop-blur-xl">
                    <form onSubmit={handleEditSubmit}>
                      <div className="mb-4">
                        <label htmlFor="username" className="block text-gray-300">Username:</label>
                        <input
                          type="text"
                          id="username"
                          name="username"
                          value={editUser.username}
                          onChange={handleEditChange}
                          className="w-full px-3 py-2 bg-neutral-800 text-white rounded-md focus:outline-none focus:bg-neutral-900"
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label htmlFor="password" className="block text-gray-300">Password (leave blank to keep unchanged):</label>
                        <input
                          type="password"
                          id="password"
                          name="password"
                          value={editUser.password || ''}
                          onChange={handleEditChange}
                          className="w-full px-3 py-2 bg-neutral-800 text-white rounded-md focus:outline-none focus:bg-neutral-900"
                        />
                      </div>
                      <div className="mb-4">
                        <span className="block text-gray-300">Roles:</span>
                        {[...AVAILABLE_ROLES].sort().map(role => (
                          <label key={role} className="inline-flex items-center">
                            <input
                              type="checkbox"
                              name="roles"
                              value={role}
                              checked={editUser.roles.includes(role)}
                              onChange={handleEditChange}
                              className="form-checkbox h-5 w-5 text-blue-600 space-x-2"
                            />
                            <span className="ml-2 text-white">{role.charAt(0).toUpperCase() + role.slice(1)}</span>
                          </label>
                        ))}
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-2 rounded-md transition duration-200"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      {filteredUsers.length > 0 && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-500 text-white rounded-md mr-2 disabled:bg-gray-300"
          >
            Previous
          </button>
          <span className="px-3 py-1">{currentPage} / {totalPages}</span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-500 text-white rounded-md ml-2 disabled:bg-gray-300"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default UserList;
