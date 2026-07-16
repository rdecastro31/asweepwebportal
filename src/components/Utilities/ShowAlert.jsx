import Swal from 'sweetalert2';
import { renderToStaticMarkup } from 'react-dom/server';
import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiInfo } from 'react-icons/fi';
import '../../styles/components/swalGlobal.css';

// Map each variant to its corresponding Feather component, color string, and CSS class
const THEMES = {
    success: {
        title: "Success",
        className: 'app-alert-success',
        iconComponent: <FiCheckCircle size={36} color="#16a34a" strokeWidth={2.5} />
    },
    error: {
        title: "Error",
        className: 'app-alert-error',
        iconComponent: <FiXCircle size={36} color="#dc2626" strokeWidth={2.5} />
    },
    warning: {
        title: "Warning",
        className: 'app-alert-warning',
        iconComponent: <FiAlertTriangle size={36} color="#ea580c" strokeWidth={2.5} />
    },
    info: {
        title: "Info",
        className: 'app-alert-info',
        iconComponent: <FiInfo size={36} color="#2563eb" strokeWidth={2.5} />
    }
};

// 1. Added 'onConfirm' to the destructuring arguments
export const showAlert = ({ mode = 'info', title = 'Info', message, buttonText = 'OK', onConfirm }) => {
    const currentTheme = THEMES[mode] || THEMES.info;

    // Transform the React Component layout into a clean HTML string segment
    const staticIconHtml = renderToStaticMarkup(currentTheme.iconComponent);

    return Swal.fire({
        html: `
      <div class="app-alert-wrapper">
        <div class="app-alert-header">
          <div class="app-alert-icon-frame">${staticIconHtml}</div>
          <h2>${title || currentTheme.title}</h2>
          <p>${message}</p>
        </div>
      </div>
    `,
        customClass: {
            container: 'app-alert-container',
            popup: `app-alert-popup ${currentTheme.className}`,
            htmlContainer: 'app-alert-html-container',
            actions: 'app-alert-actions',
            confirmButton: 'app-alert-confirm-btn'
        },
        buttonsStyling: false,
        confirmButtonText: buttonText,
        showCloseButton: false,
        allowOutsideClick: false
    }).then((result) => {
        // 2. Check if the confirm button was clicked AND if a custom function was provided
        if (result.isConfirmed && typeof onConfirm === 'function') {
            onConfirm();
        }
        // If onConfirm isn't provided, it gracefully falls back to SweetAlert's default behavior (just closing the modal)
    });
};