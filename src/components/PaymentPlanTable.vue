<script setup>
const {paymentPlan} = defineProps({
  paymentPlan: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <div class="tw-bg-white tw-relative tw-cursor-pointer tw-h-[340px] tw-overflow-hidden tw-rounded tw-border tw-border-[#232323] tw-border-opacity-50">
    <div class="tw-relative tw-h-full tw-overflow-y-auto tw-flex tw-flex-col tw-justify-between">
      <table class="table tw-w-full">
        <thead class="tw-sticky tw-top-0 tw-left-0">
        <tr class="tw-bg-[#5C4C37]">
          <th class="tw-px-2 tw-py-3 tw-text-left tw-text-white tw-font-normal tw-text-sm">
            Inst.
          </th>
          <th class="tw-px-2 tw-py-3 tw-text-left tw-text-white tw-font-normal tw-text-sm">
            Milestone
          </th>
          <th class="tw-px-2 tw-py-3 tw-text-left tw-text-white tw-font-normal tw-text-sm">
            Percentage
          </th>
          <th class="tw-px-2 tw-py-3 tw-text-left tw-text-white tw-font-normal tw-text-sm">
            Date
          </th>
          <th v-if="paymentPlan.installments.some(i => i.amount_formatted !== null)" class="tw-px-2 tw-py-3 tw-text-left tw-text-white tw-font-normal tw-text-sm">
            Amount
          </th>
          <th v-for="currency in Object.keys(paymentPlan.installments[0]?.other_amounts_formatted)"
            :key="currency"
            class="tw-px-2 tw-py-3 tw-text-left tw-text-white tw-font-normal tw-text-sm">
            Amount in {{ currency }}
          </th>
        </tr>
        </thead>

        <tbody class="tw-divide-y">
            <tr v-for="(item, i) in paymentPlan.installments" :key="i" class="tw-border-b tw-border-[#E6E9E5] tw-text-sm">
              <td :key="item.id" class="tw-border-t tw-px-2 tw-py-3 tw-text-dark tw-bg-[#F6F6F0]">
                {{ i + 1 }}
              </td>
              <td class="tw-border-t tw-px-2 tw-py-3 tw-text-dark">
                {{ item.milestone }}
              </td>
              <td class="tw-border-t tw-px-2 tw-py-3 tw-text-dark tw-whitespace-nowrap">
                {{ item.percentage }}%
              </td>
              <td class="tw-border-t tw-px-2 tw-py-3 tw-text-dark tw-whitespace-nowrap">
                {{ item.date }}
              </td>
              <td v-if="item.amount_formatted" class="tw-border-t tw-px-2 tw-py-3 tw-whitespace-nowrap tw-text-dark tw-bg-[#F6F6F0]">
                {{ item.amount_formatted }}
              </td>
              <td v-for="currency in Object.keys(item.other_amounts_formatted)"
                :key="currency"
                class="tw-border-t tw-px-2 tw-py-3 tw-whitespace-nowrap tw-text-dark tw-bg-[#F6F6F0]">
                {{ item.other_amounts_formatted[currency] }}
              </td>
            </tr>
            <tr v-if="paymentPlan.installments.some(i => i.amount_formatted !== null)" class="tw-sticky tw-bottom-0 tw-left-0 tw-bg-white">
              <td class="tw-px-2 tw-py-3 tw-text-sm tw-font-medium">Total price</td>
              <td></td>
              <td></td>
              <td></td>
              <td class="tw-px-2 tw-py-3 tw-text-sm tw-font-semibold">{{ paymentPlan.total_price_formatted }}</td>
              <td v-for="currency in Object.keys(paymentPlan.other_total_prices_formatted)"
                :key="currency" class="tw-px-2 tw-py-3 tw-text-sm tw-font-semibold">
                {{ paymentPlan.other_total_prices_formatted[currency] }}
              </td>
            </tr>
          </tbody>
      </table>
    </div>
  </div>
</template>
