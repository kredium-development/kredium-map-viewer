<script setup>
import { ref } from "vue";
import UnitCardHorizontal from "@/components/units/UnitCardHorizontal.vue";
import ModalLayout from "./ModalLayout.vue";
import AuthService from "@/api/services/Auth";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import IntlTelInput from "intl-tel-input/vueWithUtils";
import "intl-tel-input/styles";

const authStore = useAuthStore();
const route = useRoute();
const embedUuid = route.params.embedUuid;
const { building } = defineProps({
  building: {
    type: Object,
  },
});
const unit = ref();
const successState = ref(false);
const isModalOpened = ref(false);
const defaultForm = {
  first_name: null,
  last_name: null,
  phone: null,
  email: null,
  referral_building_uuid: building.uuid,
  referral_unit_uuid: null,
};
const form = ref(defaultForm)
const formErrors = ref({});

const register = () => {
  formErrors.value = {};
  (new AuthService).register(embedUuid, form.value).then(() => {
    authStore.setData(form.value.first_name, form.value.last_name, form.value.email, form.value.phone);
    form.value = defaultForm;
    successState.value = true;
    setTimeout(() => {
      isModalOpened.value = false;
      successState.value = false;
    }, 2000);
  }).catch((error) => {
    formErrors.value = error.response.data.errors ?? {};
  });
}

const open = (u = undefined) => {
  unit.value = u;
  form.value = {
    ...form.value,
    ...authStore.getData
  }
  if (u) {
    form.value.referral_unit_uuid = u.uuid;
  }
  isModalOpened.value = true;
};

const close = () => {
  isModalOpened.value = false;
};

const cacheIpApiResponse = (name, value, days) => {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000); // Set expiration in days
  const expires = "expires=" + date.toUTCString();
  document.cookie = name + "=" + value + ";" + expires + ";path=/; SameSite=None; Secure";
}

const getCachedIpApiResponse = (name) => {
  const nameEQ = name + "=";
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    let c = cookies[i].trim();
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

const geoIpLookup = (success, failure) => {
  const cachedCountryCode = getCachedIpApiResponse("country_code");
  if (cachedCountryCode) {
    success(cachedCountryCode);
    return;
  }

  fetch("https://ipapi.co/json")
    .then((res) => res.json())
    .then((data) => {
      cacheIpApiResponse("country_code", data.country_code, 30);
      success(data.country_code);
    })
    .catch(() => failure());
}

defineExpose({ open });

</script>

<template>
  <ModalLayout :is-open="isModalOpened">
    <div
      class="tw-absolute tw-top-1/2 tw-left-1/2 tw-transform -tw-translate-x-1/2 -tw-translate-y-1/2 tw-overflow-y-auto tw-bg-white tw-w-[572px] tw-max-w-full tw-rounded-lg">
      <div class="tw-flex tw-items-center tw-px-6 tw-py-4 tw-border-b">
        <span class="tw-font-semibold" v-if="unit">Request a call back</span>
        <span class="tw-font-semibold" v-else>Register interest</span>

        <button class="tw-ml-auto" @click.prevent="close">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.6 1.40039L1.40002 16.6004" stroke="#241C15" stroke-width="1.5" stroke-linecap="round"
              stroke-linejoin="round" />
            <path d="M1.40002 1.40039L16.6 16.6004" stroke="#241C15" stroke-width="1.5" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
        </button>
      </div>

      <div class="tw-bg-silver tw-p-6 tw-space-y-6">
        <UnitCardHorizontal v-if="unit" :unit="unit" :building="building" />

        <div v-if="!successState" class="tw-space-y-3 tw-mb-4">
          <div class="tw-grid sm:tw-grid-cols-2 tw-gap-3">
            <div>
              <input type="text" id="first-name" placeholder="First name"
                class="tw-rounded-lg tw-border tw-p-4 tw-text-dark tw-w-full tw-placeholder-secondary-dark"
                v-model="form.first_name">
              <label v-if="formErrors.first_name" class="tw-text-red-400">{{ formErrors.first_name[0] }}</label>
            </div>

            <div>
              <input type="text" id="last-name" placeholder="Last name"
                class="tw-rounded-lg tw-border tw-p-4 tw-text-dark tw-w-full tw-placeholder-secondary-dark"
                v-model="form.last_name">
              <label v-if="formErrors.last_name" class="tw-text-red-400">{{ formErrors.last_name[0] }}</label>
            </div>
          </div>

          <div>
            <IntlTelInput :options="{
              initialCountry: 'auto',
              geoIpLookup: geoIpLookup,
              separateDialCode: true,
              strictMode: true,
              containerClass: 'tw-w-full'
            }" class="tw-p-4 tw-border tw-rounded-lg tw-w-full" :value="form.phone"
              @changeNumber="(newNumber) => form.phone = newNumber" />

            <!-- <input type="text" id="name" placeholder="Phone number"
              class="tw-rounded-lg tw-border tw-p-4 tw-text-dark tw-w-full tw-placeholder-secondary-dark"
              v-model="form.phone"> -->
            <label v-if="formErrors.phone" class="tw-text-red-400">{{ formErrors.phone[0] }}</label>
          </div>

          <!-- <div class="tw-grid sm:tw-grid-cols-2 tw-gap-3">
              <div
                class="tw-rounded-lg tw-overflow-hidden tw-relative tw-bg-white tw-border tw-py-1 tw-px-4 tw-text-dark tw-w-full tw-grid">
                <label for="time" class="tw-relative tw-z-10">
                  <span class="tw-flex tw-text-secondary-dark tw-text-xs tw-font-medium">
                    Time (optional)
                  </span>
                </label>

                <input type="time" id="time" class="tw-outline-0 tw-absolute tw-w-full tw-p-4 tw-top-0"
                  placeholder="hh:mm" v-model="form.time">
              </div>

              <div
                class="tw-rounded-lg tw-h-[58px] tw-overflow-hidden tw-relative tw-bg-white tw-border tw-py-1 tw-px-4 tw-text-dark tw-w-full tw-grid">
                <label for="date" class="tw-relative tw-z-10">
                  <span class="tw-flex tw-text-secondary-dark tw-text-xs tw-font-medium">
                    Date (optional)
                  </span>
                </label>

                <input type="date" id="date" placeholder="dd.mm.yyyy"
                  class="tw-outline-0 tw-absolute tw-w-full tw-h-full tw-p-4 tw-top-0" v-model="form.date">
              </div>
            </div> -->

          <div>
            <input type="email" placeholder="Email"
              class="tw-rounded-lg tw-border tw-p-4 tw-text-dark tw-w-full tw-placeholder-secondary-dark"
              v-model="form.email">
            <label v-if="formErrors.email" class="tw-text-red-400">{{ formErrors.email[0] }}</label>
          </div>

          <button @click="register" type="button"
            class="tw-bg-dark tw-w-full tw-py-3 tw-text-white tw-font-semibold tw-rounded-lg">Submit</button>
        </div>
        <div v-else>
          <p class="tw-text-secondary-primary">Registration successful!</p>
        </div>
      </div>
    </div>
  </ModalLayout>
</template>
