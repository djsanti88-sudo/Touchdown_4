"use strict";

// Two arrays keep the opportunities and form fields in one place.
const opportunities = [
  { id: "volunteer", title: "Volunteer with the rescue", detail: "Help with animal care, community events, transport, or outreach.", next: "Tell us when you are available and which activities interest you." },
  { id: "foster", title: "Offer a temporary home", detail: "Give a pet a safe place to settle while the team looks for an adoptive family.", next: "Tell us about your household, pet experience, and available time." },
  { id: "adoption", title: "Learn about adoption", detail: "Talk with the rescue team about available pets and a good match for your home.", next: "Share the kind of pet you hope to adopt and ask about the next steps." }
];
const formFields = ["full-name", "email", "interest", "availability", "experience", "message"];
const storageKeys = { choice: "rescueInterest", draft: "rescueInquiryDraft" };
const errorMessages = {
  "full-name": "Please enter your name using at least 2 characters.",
  email: "Please enter a valid email address, such as name@example.com.",
  interest: "Please choose an interest type.",
  availability: "Please tell us when you are available.",
  experience: "Please share your pet experience. It is fine to say you are new to this.",
  message: "Please write a message with at least 10 characters."
};

function readStorage(storage, key) {
  try { return storage.getItem(key); } catch { return null; }
}
function writeStorage(storage, key, value) {
  try { storage.setItem(key, value); return true; } catch { return false; }
}
function removeStorage(storage, key) {
  try { storage.removeItem(key); return true; } catch { return false; }
}
// Access to the storage object itself can also be blocked by browser settings.
function getStorage(name) {
  try { return window[name]; } catch { return null; }
}
function getChoice() {
  const value = readStorage(getStorage("localStorage"), storageKeys.choice);
  return opportunities.some(item => item.id === value) ? value : "";
}
function renderInterest(value) {
  const result = document.getElementById("interest-result");
  if (!result) return;
  result.replaceChildren();
  const item = opportunities.find(option => option.id === value);
  if (!item) return;
  const title = document.createElement("h3");
  title.textContent = item.title;
  const detail = document.createElement("p");
  detail.textContent = item.detail;
  const next = document.createElement("p");
  next.textContent = item.next;
  const link = document.createElement("a");
  link.href = "contact.html";
  link.className = "button";
  link.textContent = "Continue to the interest form";
  result.append(title, detail, next, link);
}
function initPlanner() {
  const choice = document.getElementById("help-choice");
  if (!choice) return;
  const status = document.getElementById("choice-status");
  choice.value = getChoice();
  renderInterest(choice.value);
  if (choice.value) status.textContent = "Your saved interest has been restored.";
  choice.addEventListener("change", () => {
    renderInterest(choice.value);
    const saved = choice.value
      ? writeStorage(getStorage("localStorage"), storageKeys.choice, choice.value)
      : removeStorage(getStorage("localStorage"), storageKeys.choice);
    status.textContent = saved ? (choice.value ? "Your choice is saved on this browser." : "No interest is selected.") : "Your choice works now, but this browser could not save it.";
  });
  document.getElementById("clear-choice").addEventListener("click", () => {
    const removed = removeStorage(getStorage("localStorage"), storageKeys.choice);
    choice.value = "";
    renderInterest("");
    status.textContent = removed ? "Your saved choice has been cleared." : "The selection is cleared here, but this browser could not remove the saved choice.";
  });
}
function collectDraft() {
  return Object.fromEntries(formFields.map(id => [id, document.getElementById(id).value]));
}
function saveDraft() {
  const draft = collectDraft();
  const saved = writeStorage(getStorage("sessionStorage"), storageKeys.draft, JSON.stringify(draft));
  if (draft.interest) writeStorage(getStorage("localStorage"), storageKeys.choice, draft.interest);
  else removeStorage(getStorage("localStorage"), storageKeys.choice);
  document.getElementById("draft-status").textContent = saved ? "Your draft is saved in this browser tab." : "This browser could not save your draft. You can still complete the form.";
}
function restoreDraft() {
  let draft = {};
  try {
    const parsed = JSON.parse(readStorage(getStorage("sessionStorage"), storageKeys.draft) || "{}");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) draft = parsed;
  } catch { /* An unreadable draft should never stop the form. */ }
  let restored = false;
  formFields.forEach(id => {
    if (typeof draft[id] === "string") { document.getElementById(id).value = draft[id]; restored = true; }
  });
  const choice = getChoice();
  // The latest choice on Services takes precedence over an older draft choice.
  document.getElementById("interest").value = choice;
  document.getElementById("draft-status").textContent = restored
    ? "Your saved draft has been restored in this tab."
    : choice ? "Your saved interest has been filled in for you." : "Your draft will be saved as you type in this tab.";
}
function validateField(id) {
  const field = document.getElementById(id);
  const value = field.value.trim();
  let valid = value.length > 0;
  if (id === "full-name") valid = value.length >= 2;
  if (id === "message") valid = value.length >= 10;
  if (id === "email") valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  if (id === "interest") valid = opportunities.some(item => item.id === value);
  field.setAttribute("aria-invalid", String(!valid));
  document.getElementById(id + "-error").textContent = valid ? "" : errorMessages[id];
  return valid;
}
function validateForm(event) {
  event.preventDefault();
  const results = formFields.map(id => ({ id, valid: validateField(id) }));
  const firstError = results.find(result => !result.valid);
  const status = document.getElementById("form-status");
  if (firstError) {
    status.textContent = "Please correct the fields marked below. Your entries are still here.";
    document.getElementById(firstError.id).focus();
    return;
  }
  saveDraft();
  status.textContent = "Your inquiry passed the checks. This class project does not send it to the rescue.";
}
function initForm() {
  const form = document.getElementById("interest-form");
  if (!form) return;
  // Keep built-in HTML validation available when JavaScript is disabled.
  form.noValidate = true;
  formFields.forEach(id => {
    const field = document.getElementById(id);
    field.setAttribute("aria-describedby", id + "-error");
    field.addEventListener("input", () => {
      saveDraft();
      document.getElementById("form-status").textContent = "";
      if (field.getAttribute("aria-invalid") === "true") validateField(id);
    });
    field.addEventListener("change", saveDraft);
  });
  restoreDraft();
  form.addEventListener("submit", validateForm);
  document.getElementById("clear-draft").addEventListener("click", () => {
    const draftRemoved = removeStorage(getStorage("sessionStorage"), storageKeys.draft);
    const choiceRemoved = removeStorage(getStorage("localStorage"), storageKeys.choice);
    form.reset();
    document.getElementById("interest").value = "";
    formFields.forEach(id => {
      document.getElementById(id).removeAttribute("aria-invalid");
      document.getElementById(id + "-error").textContent = "";
    });
    document.getElementById("form-status").textContent = "";
    document.getElementById("draft-status").textContent = draftRemoved && choiceRemoved ? "Your draft and saved interest have been cleared." : "The form is cleared here, but this browser could not remove all saved data.";
  });
}
initPlanner();
initForm();
