import { useAuthStore } from '@/store/useAuthStore';
import { frequentContacts as defaultTestContacts } from './mocks/walletService';

function getStorageKey() {
  const user = useAuthStore.getState().session?.user;
  const identifier = user?.id || user?.email || user?.cuit || 'default';
  return `padi_frequent_contacts_${identifier}`;
}

export function getFrequentContacts() {
  try {
    const stored = localStorage.getItem(getStorageKey());
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    return [];
  }

  if (import.meta.env.MODE === 'test') {
    return defaultTestContacts;
  }

  return [];
}

export function saveFrequentContact(contact) {
  if (!contact?.destination) return [];

  const destinationKey = contact.destination.trim().toLowerCase();
  const currentList = getFrequentContacts();
  const existingIndex = currentList.findIndex(
    item => item.destination?.trim().toLowerCase() === destinationKey
  );

  const updatedEntry = {
    destination: contact.destination.trim(),
    name: contact.name?.trim() || contact.destination.trim(),
    cuit: contact.cuit || '',
    bank: contact.bank || 'padi.',
    alias: contact.alias || '',
    cvu: contact.cvu || '',
    lastUsedAt: new Date().toISOString(),
  };

  let nextList;
  if (existingIndex >= 0) {
    nextList = [...currentList];
    nextList[existingIndex] = {
      ...nextList[existingIndex],
      ...updatedEntry,
      name: nextList[existingIndex].name || updatedEntry.name,
    };
  } else {
    nextList = [updatedEntry, ...currentList];
  }

  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(nextList));
  } catch {
    return nextList;
  }

  return nextList;
}

export function updateContactName(destination, newName) {
  if (!destination || !newName?.trim()) return getFrequentContacts();

  const destinationKey = destination.trim().toLowerCase();
  const currentList = getFrequentContacts();
  const nextList = currentList.map(item =>
    item.destination?.trim().toLowerCase() === destinationKey
      ? { ...item, name: newName.trim() }
      : item
  );

  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(nextList));
  } catch {
    return nextList;
  }

  return nextList;
}

export function deleteFrequentContact(destination) {
  if (!destination) return getFrequentContacts();

  const destinationKey = destination.trim().toLowerCase();
  const currentList = getFrequentContacts();
  const nextList = currentList.filter(
    item => item.destination?.trim().toLowerCase() !== destinationKey
  );

  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(nextList));
  } catch {
    return nextList;
  }

  return nextList;
}

export function isContactSaved(destination) {
  if (!destination) return false;
  const destinationKey = destination.trim().toLowerCase();
  const currentList = getFrequentContacts();
  return currentList.some(
    item => item.destination?.trim().toLowerCase() === destinationKey
  );
}
