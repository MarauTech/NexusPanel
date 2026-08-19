import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { Rocket } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export default function Setup() {
  const [formData, setFormData] = useState({
    username: 'admin',
    password: '',
    confirmPassword: '',
    dashboardName: 'NexusPanel'
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }
    if (formData.password.length < 6) {
      addToast('Password must be at least 6 characters', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.auth.setup({
        username: formData.username,
        password: formData.password,
        dashboardName: formData.dashboardName
      });
      await login(formData.username, formData.password);
      addToast('Setup completed successfully!', 'success');
      navigate('/');
    } catch (err) {
      addToast('Failed to complete setup', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-secondary p-4">
      <div className="w-full max-w-md bg-bg-card rounded-xl shadow-theme border border-border p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <Rocket className="w-6 h-6 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Welcome to NexusPanel</h1>
          <p className="text-text-secondary mt-1 text-center">Let's set up your first administrator account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Dashboard Name"
            name="dashboardName"
            value={formData.dashboardName}
            onChange={handleChange}
            required
          />
          <Input
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          <Button
            type="submit"
            className="w-full mt-6"
            isLoading={loading}
          >
            Continue
          </Button>
        </form>
      </div>
    </div>
  );
}
