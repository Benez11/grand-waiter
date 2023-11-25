/**
 * G R A N D  -  W A I T E R 🫱🏼‍🫲🏾
 *
 * M A D - H O U S E
 *
 * Hi there 👋🏼 Glad to have you here!
 *
 * So this package was created with one goal in mind - figure out a different way to handle callbacks in the asynchronous world of NodeJS aside the usual "promisify" patterns out there.
 * This means it was made to work with methods/functions whose callback syntax may not follow the (error, data, ...) standard.
 *
 * You may find it useful in the way it also allows you control the flow of code execution
 *
 * And so without further delay, happy exploration! 🏳️
 */

const wait_array_name = "wait_list";

const GrandWaiter = async ({
  obj = { arr: [] },
  minimum_count = 1,
  refresh_array = false,
  _this,
  use_moving_counter,
}) => {
  let ext_resolve,
    resolved = false,
    count = use_moving_counter ? obj.arr?.length || 0 : 0;

  if (minimum_count <= count) return; // don't even wait at all if items added are equal to or more than the expected number to wait to be added

  const waiting_promise = (() =>
    new Promise((resolve) => (ext_resolve = resolve)))();

  if (!refresh_array && obj.arr && Number.isInteger(obj.arr.length))
    obj.arr.push(waiting_promise);
  else {
    obj.arr = [waiting_promise];
    _this.is_broken = false;
  }

  const proxy_handler = {
    set(target, prop_key) {
      if (prop_key !== "length") count++;
      const to_be_returned = Reflect.set(...arguments); // arguments are target, propKey, value, and receiver*
      if (ext_resolve && !resolved && count >= minimum_count) {
        ext_resolve("Dummy promise resolved!");
        target.splice(target.length - minimum_count - 1, 1);
        resolved = true;
      }
      return to_be_returned;
    },
  };

  obj[wait_array_name] = new Proxy(obj.arr, proxy_handler);
  await Promise.all(obj[wait_array_name]);
};

module.exports = (init_minimum_count) => {
  const wait_object = {};
  let min_count,
    appended = 0,
    has_been_delayed = false;

  const _this = {
    wait_object,
    is_broken: false,
    async_fn: async (async_cb) => await async_cb(),
    delay(milliseconds = 1000) {
      return new Promise((res) => setTimeout(res, milliseconds));
    },
    delay_once(milliseconds) {
      if (!has_been_delayed) {
        has_been_delayed = true;
        return _this.delay(milliseconds);
      }
    },
    append: (promise_or_any) => {
      appended++;
      return wait_object[wait_array_name]
        ? wait_object[wait_array_name].push(promise_or_any)
        : (wait_object[wait_array_name] = [promise_or_any]);
    },
    wait: (
      minimum_count = init_minimum_count,
      use_moving_counter = true,
      refresh_array = false
    ) => {
      if (_this.is_broken) return; // do not wait as its already been skipped - think of this as continue

      min_count = minimum_count;
      return GrandWaiter({
        obj: wait_object,
        minimum_count: Number.isInteger(minimum_count)
          ? minimum_count
          : Number.isInteger(init_minimum_count)
          ? init_minimum_count
          : undefined,
        refresh_array,
        _this,
        use_moving_counter,
      });
    },
    break_wait: (append_arg) => {
      if (!_this.is_broken && min_count === undefined) _this.is_broken = true;
      else if (!_this.is_broken && appended < min_count) {
        [...new Array(min_count - appended)].forEach(() =>
          _this.append(append_arg)
        );
        _this.is_broken = true;
      }

      return "no-more-loops";
    },
  };
  return _this;
};

/**
 * grand_waiter.wait_for(
 *   2,
 *   ["log-request", "created-user", ...],
 *   { match: "<regex>", matchAll: ["<regex-statement-1>", "<regex-statement-2>", ...] },
 *   (append_list) => Date.now() === 12345 && ["log-request", "created-user"].every(expexted_block_item => append_list.includes(expected_block_item)),
 *
 * )
 */

gw.async_cb;
gw.search;
gw.wait_for;
gw.done;
gw.wait_for_all;

gw.async_cb("in-&-out", async (context) => {
  await fetch_db_op();

  await gw.wait_for(["created-user"]);

  await save_db_op();

  await gw.append("log-request");
});

gw.async_cb(
  "second-call",
  async (context) => {
    await gw.wait_for(["log-request"]);
    //

    await save_db_op();
  },
  { dependencies: ["log-request"] },
  false, // true - executes the callback immediately or (false) at a later time, in which case the result of this async_cb() must be assigned to a variable.
  async (context) => {
    // retrace steps in case this cb fails to execute
  }
);
