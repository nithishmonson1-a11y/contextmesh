'use client';
import { useState, useEffect } from 'react';
import { getUserId, getUserName, setUserName } from '@/lib/identity';

export function useIdentity() {
  const [id, setId] = useState('');
  const [name, setName] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setId(getUserId());
    setName(getUserName());
    setIsLoaded(true);
  }, []);

  const saveName = (newName: string) => {
    setUserName(newName);
    setName(newName);
  };

  return { id, name, saveName, isLoaded };
}
