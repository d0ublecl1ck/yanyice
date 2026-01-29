import type { CustomerCreateInput, CustomerGender } from "@/lib/types";

export type CustomerFormState = {
  name: string;
  gender: CustomerGender;
  birthDate: string;
  birthTime: string;
  phone: string;
  notes: string;
  tags: string[];
};

export function buildCreateCustomerPayload(state: CustomerFormState): CustomerCreateInput {
  return {
    name: state.name,
    phone: state.phone,
    notes: state.notes,
    tags: state.tags,
    customFields: {},
  };
}

export function buildUpdateCustomerPayload(state: CustomerFormState): CustomerCreateInput {
  return {
    name: state.name,
    gender: state.gender,
    birthDate: state.birthDate,
    birthTime: state.birthTime,
    phone: state.phone,
    notes: state.notes,
    tags: state.tags,
    customFields: {},
  };
}

