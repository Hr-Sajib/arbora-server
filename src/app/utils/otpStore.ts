export const otpStore: { [email: string]: { otp: string; expiresAt: number } } = {};

export const saveOTP = (email: string, otp: string) => {
  otpStore[email] = {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 mins
  };
  console.log(`3. OTP stored for ${email}:`, otpStore[email]); // 🔍 Debugging
};


export const verifyOTP = (email: string, otp: string) => {

  console.log("\n\nreq with: ",email, otp)
  console.log("otpStore ",otpStore)


  const data = otpStore[email];
  console.log("data :", data)
  if (!data) return false;
  const isValid = data.otp === otp && Date.now() < data.expiresAt;
  console.log("data is valid: ", data.otp === otp)
  console.log("date now: ", Date.now())
  console.log("date stored: ", data.expiresAt)
  console.log("isValid: ", isValid)
  if (isValid) delete otpStore[email];
  return isValid;
};
