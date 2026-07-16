let timer = null

self.onmessage = function (e) {
  if (e.data.action === "start") {
    const { apiUrl, interval } = e.data

    timer = setInterval(async () => {
      try {
        const fd = new FormData()
        fd.append("tag", "check_heartbeat")

        // Web Workers support standard fetch
        const response = await fetch(`${apiUrl}/index.php`, {
          method: "POST",
          credentials: "include",
          body: fd,
        })

        if (response.status === 401) {
          // Tell the main React thread that the cookie expired
          self.postMessage({ status: "unauthorized" })
        }
      } catch (err) {
        self.postMessage({ status: "error", error: err.message })
      }
    }, interval)
  }

  if (e.data.action === "stop") {
    clearInterval(timer)
  }
}
