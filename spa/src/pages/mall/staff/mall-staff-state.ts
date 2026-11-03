import Vue from "vue";

/**
 * The Pending queue's size, shared between the Pending list and the staff
 * controls in the site's right-hand panel.
 *
 * The export control lives in the control panel but describes the Pending list,
 * so it has to know whether that list is empty. The list already counts the
 * queue on every load and after every moderation action; publishing that number
 * here keeps the control in step without a second, separately-timed count that
 * could disagree with what staff can see on screen.
 *
 * `null` means "not counted yet" and is deliberately distinct from `0`, so the
 * control can stay hidden until the real number is known rather than flickering
 * in and out on first paint.
 */
const mallStaffState = Vue.observable<{ pendingCount: number | null }>({
  pendingCount: null,
});

export default mallStaffState;
