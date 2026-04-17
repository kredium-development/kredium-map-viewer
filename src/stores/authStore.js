import {defineStore} from 'pinia';

export const useAuthStore = defineStore('authStore', {
  state: () => ({
    firstName: null,
    lastName: null,
    email: null,
    phone: null,
  }),
  actions: {
    setData(firstName, lastName, email, phone) {
      this.firstName = firstName;
      this.lastName = lastName;
      this.email = email;
      this.phone = phone;
    }
  },
  getters: {
    getData() {
      return {
        first_name: this.firstName,
        last_name: this.lastName,
        phone: this.phone,
        email: this.email,
      };
    }
  },
});
