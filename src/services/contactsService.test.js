import { beforeEach, describe, expect, it } from 'vitest';
import {
  deleteFrequentContact,
  getFrequentContacts,
  isContactSaved,
  saveFrequentContact,
  updateContactName,
} from './contactsService';

describe('contactsService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('guarda un contacto frecuente y lo recupera ordenado al frente', () => {
    const contact = {
      destination: 'lucas.perez.padi',
      name: 'Lucas Pérez',
      cuit: '20301234567',
      bank: 'padi.',
    };

    saveFrequentContact(contact);
    expect(isContactSaved('lucas.perez.padi')).toBe(true);

    const list = getFrequentContacts();
    expect(list[0]).toMatchObject({
      destination: 'lucas.perez.padi',
      name: 'Lucas Pérez',
      cuit: '20301234567',
      bank: 'padi.',
    });
  });

  it('permite actualizar el nombre de un contacto existente', () => {
    saveFrequentContact({
      destination: 'juan.padi',
      name: 'Juan Perez',
      bank: 'padi.',
    });

    updateContactName('juan.padi', 'Juancito');
    const list = getFrequentContacts();
    expect(list.find(c => c.destination === 'juan.padi')?.name).toBe('Juancito');
  });

  it('permite eliminar un contacto frecuente', () => {
    saveFrequentContact({
      destination: 'maria.padi',
      name: 'María Gómez',
      bank: 'padi.',
    });

    expect(isContactSaved('maria.padi')).toBe(true);
    deleteFrequentContact('maria.padi');
    expect(isContactSaved('maria.padi')).toBe(false);
  });
});
