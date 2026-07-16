import { API_URL } from "./constants"

export const fetchSubAccounts = async ({
  email,
  page,
  search = "",
  setCustomer,
}) => {
  if (!email) return null

  const fd = new FormData()
  fd.append("tag", "getsubaccounts")
  fd.append("page", page)
  fd.append("limit", 10)
  if (search.trim() !== "") {
    fd.append("search", search.trim())
  }

  const response = await fetch(`${API_URL}/index.php`, {
    method: "POST",
    credentials: "include",
    body: fd,
  })

  if (response.status === 401) {
    await handleLogout(setCustomer)
    return null
  }

  if (!response.ok) {
    throw new Error(`Accounts request failed with status: ${response.status}`)
  }

  return await response.json()
}

export const fetchDashboardKpis = async () => {
  try {
    const fd = new FormData()
    fd.append("tag", "getdashboardkpi")

    const response = await fetch(`${API_URL}/index.php`, {
      method: "POST",
      credentials: "include",
      body: fd,
    })

    if (response.status === 401) {
      await handleLogout(setCustomer)
      return
    }

    if (!response.ok) {
      throw new Error(`Accounts request failed with status: ${response.status}`)
    }

    return await response.json()
  } catch (e) {
    console.error("Fetching Balance for  failed", e)
  }
}

export const fetchBalance = async (accountNumber) => {
  try {
    const fd = new FormData()
    fd.append("tag", "checkbalance")
    fd.append("account_number", accountNumber)

    const response = await fetch(`${API_URL}/index.php`, {
      method: "POST",
      credentials: "include",
      body: fd,
    })

    if (response.status === 401) {
      await handleLogout(setCustomer)
      return
    }

    if (!response.ok) {
      throw new Error(`Accounts request failed with status: ${response.status}`)
    }

    return await response.json()
  } catch (e) {
    console.error("Fetching Balance for  failed", e)
  }
}
export const deleteAccount = async (accountNumber) => {
  try {
    const fd = new FormData()
    fd.append("tag", "deletesubaccount")
    fd.append("account_number", accountNumber)

    const response = await fetch(`${API_URL}/index.php`, {
      method: "POST",
      credentials: "include",
      body: fd,
    })

    if (response.status === 401) {
      await handleLogout(setCustomer)
      return
    }

    if (!response.ok) {
      throw new Error(
        `Delete Sub-Account request failed with status: ${response.status}`,
      )
    }

    return await response.json()
  } catch (e) {
    console.error("Delete Sub-Account for failed", e)
  }
}

export const handleLogout = async (setCustomer) => {
  try {
    const fd = new FormData()
    fd.append("tag", "logout")

    await fetch(`${API_URL}/index.php`, {
      method: "POST",
      credentials: "include",
      body: fd,
    })
  } catch (e) {
    console.error("Logout cleanup failed", e)
  } finally {
    // 1. Clear session storage
    sessionStorage.removeItem("customer")
    // 2. Clear React state immediately (this kicks them out of ProtectedRoute instantly)
    if (setCustomer) {
      setCustomer(null)
    }
  }
}

export const formatPeso = (amount) => {
  const value = Number(amount || 0)

  return value.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
  })
}
