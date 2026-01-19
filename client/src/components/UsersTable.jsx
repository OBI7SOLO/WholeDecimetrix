import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function UsersTable() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Error fetching users');
        }

        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity='error'>{error}</Alert>;
  }

  return (
    <TableContainer component={Paper} sx={{ maxWidth: 600 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
            <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Rol</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user._id}>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <span
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor:
                      user.role === 'admin' ? '#ffebee' : '#e3f2fd',
                    color: user.role === 'admin' ? '#c62828' : '#1565c0',
                    fontWeight: 'bold',
                  }}
                >
                  {user.role}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
