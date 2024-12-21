import React, { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { format, differenceInCalendarMonths, differenceInDays, addMonths } from 'date-fns';
import InvoiceForm from '../components/InvoiceForm';
import PlaceGallery from '../components/PlaceGallery';
import MapComponent from '../components/MapComponent';
import RentedUsersList from '../components/RentedUsersList';
import { BASE_URL } from '../../config';

function PlaceDetail() {
    const { id } = useParams();
    const [place, setPlace] = useState(null);
    const [redirect, setRedirect] = useState('');
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [showHiddenPopup, setShowHiddenPopup] = useState(false)
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showReportsPopup, setShowReportsPopup] = useState(false);

    useEffect(() => {
        if (!id) return;
        axios.get(`/post/placedetail/${id}`).then(response => {
            setPlace(response.data.place);
        });
    }, [id]);

    if (!place) return '';
    console.log(place.bookings)

    // lấy ra các booking theo từng trạng thái
    let bookingPending = []
    let bookingRented = []
    let bookingNow
    if(place && place.bookings.length !== 0) {
        bookingPending = place.bookings.filter(booking => booking.status === "PENDING")
        bookingNow = place.bookings.find(booking => booking.status === "APPROVED") || place.bookings.find(booking => booking.status === "WAIT")
        bookingRented = place.bookings.filter(booking => booking.status === "RENTED")
    }

    async function deleteAllBooking() {
        if(window.confirm('Bạn có chắc chắn muốn xóa tất cả?')) {
            await axios.post('/booking/delete-all-booking', id)
            window.location.reload()
        }

    }

    async function acceptBooking(bookingId) {
        const data = {
            bookingId: bookingId,
            placeId: id
        };
        const response = await axios.post('/booking/accept', data);
        window.location.reload();
    }

    async function notRentResponse(ev, bookingId) {
        ev.preventDefault();
        const data = {bookingId}
        await axios.put('/booking/not-rent-response', data)
        window.location.reload()
    }


    if (redirect) return <Navigate to={redirect} />;

    // phần thông tin người thuê
    let content;
    let historyRent;
    if (place.bookings.length === 0 || bookingPending.length === 0 && !bookingNow) {
        content = (
            <div className="mt-6 text-center text-xl font-semibold text-gray-600">
                {place.status === 'HIDDEN' ? 'Bạn đang ẩn nhà này, người khác sẽ không thấy nhà này.' : 'Hiện tại chưa có người thuê.'}
            </div>
        );
    } else if (bookingPending.length > 0) { // hợp lý, vì là chỉ còn 1 tháng thì mới có thể gửi yêu cầu
        content = (
            <div className="mt-6">
                <p className="text-xl font-semibold text-gray-700">Danh sách người đang chờ duyệt</p>
                <button onClick={deleteAllBooking}>Xóa tất cả lượt chờ</button>
                <p className="text-lg text-gray-600">Có {bookingPending.length} người đang chờ duyệt</p>
                {bookingPending.map(booking => (
                    <div className="flex items-center justify-between bg-gray-100 p-4 mt-4 rounded-lg shadow-md" key={booking.id}>
                        <Link to={`/profile/${booking.renter.id}`}>
                            <img
                                src={
                                    booking.renter?.avatar
                                        ? BASE_URL + booking.renter?.avatar
                                        : 'https://banner2.cleanpng.com/20180411/ike/avfjoey57.webp'
                                    }
                                alt={booking.renter.avatar}
                                className="w-12 h-12 rounded-full mr-3"
                            />
                        </Link>
                        <div className="flex-grow">
                            <a href={`/profile/${booking.renter.id}`} className="text-lg font-semibold text-gray-800 hover:underline">
                                {booking.renter.name}
                            </a>
                        </div>
                        <button
                            className="bg-green-500 text-white py-2 px-6 rounded-md hover:bg-green-600 focus:outline-none"
                            onClick={() => acceptBooking(booking.id)}
                        >
                            Duyệt
                        </button>
                    </div>
                ))}
            </div>
        );
    }

    if (bookingNow) {
        const today = new Date();
        const checkOutDate = new Date(bookingNow.checkOut);
        let monthsRemaining = differenceInCalendarMonths(checkOutDate, today);
        // const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + monthsRemaining, 1);
        // const remainingDaysInMonth = differenceInDays(checkOutDate, startOfNextMonth);
        let adjustedStartDate = addMonths(today, monthsRemaining);
        let remainingDaysInMonth = differenceInDays(checkOutDate, adjustedStartDate) + 1;

        if (remainingDaysInMonth < 0) {
            monthsRemaining -= 1;
            adjustedStartDate = addMonths(today, monthsRemaining);
            remainingDaysInMonth = differenceInDays(checkOutDate, adjustedStartDate) + 1;
        }

        let confirmNotBooking = null
        if(bookingNow.status === 'APPROVED') {
            content = (
                <div>
                    {confirmNotBooking}
                    <p className="text-3xl font-semibold text-gray-800">Thông tin người thuê</p>
                    <div className="mt-6 space-y-6">
                        <div className="p-4 bg-white border border-gray-300 rounded-lg shadow-md">
                            <div className="flex items-center mt-2 mb-4 ml-4">
                                <a
                                    href={`/profile/${bookingNow.renter.id}`} // Đường dẫn đến trang cá nhân
                                    className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-300 shadow-lg flex-shrink-0"
                                >
                                    <img
                                        src={
                                            bookingNow.renter.avatar
                                            ? BASE_URL+bookingNow.renter.avatar
                                            : 'https://banner2.cleanpng.com/20180411/ike/avfjoey57.webp'
                                        }
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                </a>
                                <div className="ml-4">
                                    <a
                                        href={`/profile/${bookingNow.renter.id}`} // Đường dẫn đến trang cá nhân
                                        className="text-lg font-semibold text-gray-800 hover:underline"
                                    >
                                    {bookingNow.renter.name}
                                    </a>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="relative ml-8">
                                    <p className="text-gray-600 font-semibold text-xl">Số điện thoại</p>
                                    <div className="flex items-center">
                                    <p className="text-gray-800 font-medium">{bookingNow.renter.phone ? bookingNow.renter.phone : 'Chưa cập nhật'}</p>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(bookingNow.renter.phone)}
                                        className="ml-2 text-gray-500 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                        title="Copy số điện thoại"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                                        </svg>
                                    </button>
                                    </div>
                                </div>
                                <div className="relative">
                                    <p className="text-gray-600 font-semibold text-xl">Zalo</p>
                                    <div className="flex items-center">
                                    <p className="text-gray-800 font-medium">{bookingNow.renter.zalo ? bookingNow.renter.zalo : 'Chưa cập nhật'}</p>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(bookingNow.renter.zalo)}
                                        className="ml-2 text-gray-500 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                        title="Copy Zalo"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                                        </svg>
                                    </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-white border border-gray-300 rounded-lg shadow-md">
                            <p className="text-lg font-semibold text-gray-800">Thời hạn hợp đồng:</p>
                            <p className="text-gray-600">{format(checkOutDate, 'dd-MM-yyyy')}</p>
                        </div>
                        <div className="p-4 bg-white border border-gray-300 rounded-lg shadow-md">
                            <p className="text-lg font-semibold text-gray-800">Thời gian còn lại:</p>
                            <p className="text-gray-600">
                                {monthsRemaining > 0 && `${monthsRemaining} tháng `}
                                {remainingDaysInMonth > 0 && `${remainingDaysInMonth} ngày`}
                                {monthsRemaining === 0 && remainingDaysInMonth === 0 && 'Hết hạn hôm nay'}
                            </p>
                        </div>
                    </div>

                    <InvoiceForm bookingId={bookingNow.id} />
                </div>
            );
        }

        if(bookingNow.status === 'WAIT') {
            confirmNotBooking = (
                <div>
                    <p className="text-xl font-bold primary">Người thuê đang yêu cầu hủy thuê nhà này.</p>
                    <button onClick={(ev) => notRentResponse(ev, bookingNow.id)} className="primary">Xác nhận</button>
                </div>
            )
        
            content = (
                <div>
                    {confirmNotBooking}
                    <p className="text-3xl font-semibold text-gray-800">Thông tin người thuê</p>
                    <div className="mt-6 space-y-6">
                        <div className="p-4 bg-white border border-gray-300 rounded-lg shadow-md">
                            <p className="text-lg font-semibold text-gray-800">Người thuê có ID:</p>
                            <p className="text-gray-600">{bookingNow.renterId}</p>
                        </div>
                        <div className="p-4 bg-white border border-gray-300 rounded-lg shadow-md">
                            <p className="text-lg font-semibold text-gray-800">Thời hạn hợp đồng:</p>
                            <p className="text-gray-600">{format(checkOutDate, 'dd-MM-yyyy')}</p>
                        </div>
                        <div className="p-4 bg-white border border-gray-300 rounded-lg shadow-md">
                            <p className="text-lg font-semibold text-gray-800">Thời gian còn lại:</p>
                            <p className="text-gray-600">
                                {monthsRemaining > 0 && `${monthsRemaining} tháng `}
                                {remainingDaysInMonth > 0 && `${remainingDaysInMonth} ngày`}
                                {monthsRemaining === 0 && remainingDaysInMonth === 0 && 'Hết hạn hôm nay'}
                            </p>
                        </div>
                    </div>

                    <InvoiceForm bookingId={bookingNow.id} />
                    
                    <div className="mt-6 bg-white px-8 py-8 rounded-lg shadow-md">
                        <p className="text-xl font-bold text-primary">
                            Người hiện tại đang ở sắp hết hợp đồng. <br />
                            Người khác có thể đặt ở nhưng bạn chưa thể duyệt. <br />
                        </p>

                        <p className="text-xl font-semibold text-gray-700">Danh sách người đang chờ duyệt</p>
                        <p className="text-lg text-gray-600">Có {bookingPending.length} người đang chờ duyệt</p>
                        {bookingPending.map(booking => (
                            <div className="flex items-center justify-between bg-gray-100 p-4 mt-4 rounded-lg shadow-md" key={booking.id}>
                                <p className="text-gray-800">RenterId: {booking.renterId}</p>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
    }

    if (bookingRented.length > 0) {
        historyRent = (
            <RentedUsersList bookingRented={bookingRented}/>
        )
    } else {
        historyRent = (
            <div className="bg-gray-100 px-8 py-8 border-t mt-6 rounded-lg shadow-md">
                Hiện tại nhà này chưa có ai thuê trước đây.
            </div>
        )
    }

    let pendingReports = null
    let doneReports = null
    let reportInfo = null
    if (place?.reports?.length > 0) {
        pendingReports = place.reports.filter((report) => report.status === 'PENDING');
        doneReports = place.reports.filter((report) => report.status === 'DONE');

        if (doneReports.length > 0) {
            reportInfo = (
                <div>
                    <h2 className="font-semibold text-2xl text-red-600">
                        Nhà này của bạn đã bị admin đưa vào danh sách đen và không thể hoạt động nữa.
                    </h2>
                </div>
            );
        } else if (pendingReports.length > 0) {
            reportInfo = (
                <div>
                    <h2 className="font-semibold text-2xl text-primary mb-3">Lưu ý</h2>
                    <button
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                        onClick={() => setShowReportsPopup(true)} // Mở popup
                    >
                        {`Ngôi nhà này có ${pendingReports.length} báo cáo đang chờ xử lý`}
                    </button>
                    <h2 className="font-semibold text-lg mt-2">
                        Bạn không thể ẩn, sửa hoặc xóa nhà này. Vui lòng chờ admin xử lý xong!
                    </h2>

                    {/* Popup hiển thị chi tiết các report */}
                    {showReportsPopup && (
                        <div
                            id="popup-overlay"
                            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                            onClick={(e) => {
                                if (e.target.id === 'popup-overlay') setShowReportsPopup(false); // Đóng popup khi bấm ra ngoài
                            }}
                        >
                            <div className="bg-white p-6 rounded shadow-md w-96 max-h-[90%] overflow-y-auto">
                                <h2 className="text-xl font-semibold mb-4">Danh sách báo cáo</h2>
                                <ul className="space-y-4">
                                    {pendingReports.map((report) => (
                                        <li key={report.id} className="border-b pb-4">
                                            <p><strong>Lý do:</strong> {report.reason}</p>
                                            <p><strong>Người báo cáo:</strong> {report.reporter.name} ({report.reporter.email})</p>
                                            <p><strong>Số điện thoại:</strong> {report.reporter.phone}</p>
                                            <p><strong>Trạng thái:</strong> {report.status}</p>
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    className="mt-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                                    onClick={() => setShowReportsPopup(false)} // Đóng popup
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            );
        }
    }

    const deleteHome = async () => {
        if (!confirmPassword) {
          alert('Vui lòng nhập mật khẩu để xác nhận.');
          return;
        }
    
        try {
          const response = await axios.post(
            `/post/delete-home/${id}`,
            {
              password: confirmPassword, // Mật khẩu xác nhận từ người dùng
            }
          );
    
          alert(response.data.message || 'Nhà này đã được xóa thành công.');
          window.location.href = '/account/places'; // Chuyển hướng về trang chủ hoặc trang đăng nhập
        } catch (error) {
          // Xử lý lỗi
          alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa nhà này!');
        }
    };

    const hiddenHome = async() => {
        try {
            const response = await axios.put(
              `/post/hidden-home/${id}`
            );
      
            alert(response.data.message || 'Nhà này đã được ẩn thành công.');
            window.location.href = '/account/places'; // Chuyển hướng về trang chủ hoặc trang đăng nhập
          } catch (error) {
            // Xử lý lỗi
            alert(error.response?.data?.message || 'Có lỗi xảy ra khi ẩn nhà này!');
          }
    }
    
      // Đóng popup khi nhấp ra ngoài
    const handleClosePopup = (setPopupState) => (e) => {
        if (e.target === e.currentTarget) {
            setPopupState(false);
        }
    };

    return (
        <div>
            {/* Content Based on Booking Status */}
            <div className='mt-8 bg-gray-100 px-8 py-8 rounded-lg shadow-md'>
                {content}
            </div>
            {reportInfo && <div className='mt-4 bg-gray-100 px-8 py-8 rounded-lg shadow-md'>
                {reportInfo}
            </div>}

            {/* nút ẩn, xóa và edit */}
            <div className='fixed right-12 bottom-12 group z-30'>
                {!reportInfo && (
                    <div>
                        <button
                            className="mb-3 flex gap-1 bg-slate-400 text-white p-2 rounded-lg transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                            onClick={() => setShowHiddenPopup(true)}
                        >
                            {place.status === 'SEE' ? (
                                <div className='flex gap-1'>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                    </svg>
                                    <p className="font-medium">Ẩn nhà</p>
                                </div>
                            ) : (
                                <div className='flex gap-1'>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                    </svg>
                                    <p className="font-medium">Bỏ ẩn nhà</p>
                                </div>
                            )}
                        </button>
                        <button
                            className="mb-3 flex gap-1 bg-red-600 text-white p-2 rounded-lg transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                            onClick={() => setShowDeletePopup(true)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                            <p className="font-medium">Xóa nhà</p>
                        </button>
                        {/* {!bookingNow && bookingPending?.length === 0 && ( */}
                            <Link className='flex gap-1 bg-gray-600 text-white p-2 rounded-lg z-30' to={'/account/places/' + id}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                </svg>
                                <p className='font-medium'>Sửa nhà</p>
                            </Link>
                        {/* )} */}
                    </div>
                )}
            </div>
            
            {/* Place Details Section */}
            <div className="mt-4 bg-gray-100 px-8 py-8 rounded-lg shadow-md">
                <div className='flex gap-4 items-center'>
                    <h1 className="text-3xl font-semibold text-gray-800">{place.title}</h1>
                </div>
                <div className='flex gap-6 my-2'>
                    <p className='flex gap-1 my-2 font-semibold'>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                        </svg>
                        {place.address}
                    </p>
                    {place.latitude && (
                        <MapComponent places={[place]} />
                    )}                    
                    <a
                        className="flex gap-1 px-2 py-2 text-white bg-red-500 rounded-md hover:bg-red-600"
                        target='_blank'
                        rel='noopener noreferrer'
                        href={'https://maps.google.com/?q=' + place.address}
                    >
                        Xem trên Google Map
                    </a>
                </div>
                
                <PlaceGallery place={place} />
            </div>

            {/* Place Description and Details */}
            <div className="mt-8 bg-gray-100 grid gap-8 grid-cols-1">
                <div className=" p-6 rounded-lg shadow-md">
                    <div className="my-4">
                        <h2 className="font-semibold text-2xl text-gray-800">Mô tả</h2>
                        <div 
                            className='pt-2'
                            dangerouslySetInnerHTML={{ __html: place.description }}
                        ></div>
                    </div>
                    <div className='grid grid-cols-3 gap-1 border-t-2 pt-4 pl-4'>
                        <p className="text-gray-800 font-bold">Diện tích: {place.area} m²</p>
                        <p className="text-gray-800 font-bold">Thời gian thuê: {place.duration} tháng</p>
                        <p className="text-gray-800 font-bold">Giá thuê: {place.price} triệu/tháng</p>
                    </div>
                </div>
            </div>

            {/* dịch vụ */}
            <div className="bg-gray-100 px-8 py-8 border-t mt-6 rounded-lg shadow-md">
                <h2 className="font-semibold text-2xl text-gray-800">Dịch vụ</h2>
                {place.perks.length > 0 ? (
                    <div className='grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mt-4'>
                        <label className={`w-full border p-4 flex rounded-2xl gap-2 items-center ${place.perks.some(item => item.perk === 'wifi') ? 'bg-blue-300' : 'text-gray-400'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
                            </svg>
                            <span>Wifi</span>
                        </label>
                        <label className={`w-full border p-4 flex rounded-2xl gap-2 items-center ${place.perks.some(item => item.perk === 'parking') ? 'bg-blue-300' : 'text-gray-400'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                            </svg>
                            <span>Gửi xe</span>
                        </label>
                        <label className={`w-full border p-4 flex rounded-2xl gap-2 items-center ${place.perks.some(item => item.perk === 'elevator') ? 'bg-blue-300' : 'text-gray-400'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 7.5 16.5-4.125M12 6.75c-2.708 0-5.363.224-7.948.655C2.999 7.58 2.25 8.507 2.25 9.574v9.176A2.25 2.25 0 0 0 4.5 21h15a2.25 2.25 0 0 0 2.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169A48.329 48.329 0 0 0 12 6.75Zm-1.683 6.443-.005.005-.006-.005.006-.005.005.005Zm-.005 2.127-.005-.006.005-.005.005.005-.005.005Zm-2.116-.006-.005.006-.006-.006.005-.005.006.005Zm-.005-2.116-.006-.005.006-.005.005.005-.005.005ZM9.255 10.5v.008h-.008V10.5h.008Zm3.249 1.88-.007.004-.003-.007.006-.003.004.006Zm-1.38 5.126-.003-.006.006-.004.004.007-.006.003Zm.007-6.501-.003.006-.007-.003.004-.007.006.004Zm1.37 5.129-.007-.004.004-.006.006.003-.004.007Zm.504-1.877h-.008v-.007h.008v.007ZM9.255 18v.008h-.008V18h.008Zm-3.246-1.87-.007.004L6 16.127l.006-.003.004.006Zm1.366-5.119-.004-.006.006-.004.004.007-.006.003ZM7.38 17.5l-.003.006-.007-.003.004-.007.006.004Zm-1.376-5.116L6 12.38l.003-.007.007.004-.004.007Zm-.5 1.873h-.008v-.007h.008v.007ZM17.25 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Zm0 4.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                            </svg>
                            <span>Thang máy</span>
                        </label>
                        <label className={`w-full border p-4 flex rounded-2xl gap-2 items-center ${place.perks.some(item => item.perk === 'washing') ? 'bg-blue-300' : 'text-gray-400'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z" />
                            </svg>
                            <span>Máy giặt</span>
                        </label>
                        <label className={`w-full border p-4 flex rounded-2xl gap-2 items-center ${place.perks.some(item => item.perk === 'pets') ? 'bg-blue-300' : 'text-gray-400'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
                            </svg>
                            <span>Thú cưng</span>
                        </label>
                        <label className={`w-full border p-4 flex rounded-2xl gap-2 items-center ${place.perks.some(item => item.perk === 'clean') ? 'bg-blue-300' : 'text-gray-400'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                            </svg>
                            <span>Vệ sinh</span>
                        </label>
                    </div>
                ) : (
                    <p>Không có dịch vụ</p>
                )}
            </div>

            {/* Extra Info Section */}
            <div className="bg-gray-100 px-8 py-8 border-t mt-6 rounded-lg shadow-md">
                <h2 className="font-semibold text-2xl text-gray-800">Thông tin thêm</h2>
                {place.extraInfo ? (
                    <p className="text-gray-600 mt-4 leading-6">
                        <div 
                            className='pt-2'
                            dangerouslySetInnerHTML={{ __html: place.extraInfo }} 
                        ></div>
                    </p>
                ) : (
                    <p>Chưa có thông tin</p>
                )}
            </div>

            {/* History section */}
            {historyRent}

            {/* Delete popup*/}
            {showDeletePopup && !bookingNow && !pendingReports && !doneReports && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
                    onClick={handleClosePopup(setShowDeletePopup)}
                >
                    <div className="bg-white rounded-lg p-6 w-96">
                        <h2 className="text-lg font-bold mb-4 text-red-500">Xác nhận xóa nhà này</h2>
                        <p className="text-gray-700 mb-4">
                        Bạn có chắc chắn muốn xóa nhà này không? Hành động này không thể hoàn tác.
                        </p>
                        <div className="mb-4">
                        <label className="block text-gray-700">Nhập mật khẩu để xác nhận</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2"
                            placeholder="Nhập mật khẩu của bạn"
                        />
                        </div>
                        <div className="flex justify-end">
                        <button
                            onClick={deleteHome}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg"
                        >
                            Xóa nhà này
                        </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeletePopup && bookingNow && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
                    onClick={handleClosePopup(setShowDeletePopup)}
                >
                    <div className="bg-white rounded-lg p-6 max-w-lg">
                    <h2 className="text-lg font-bold mb-4 text-red-500">Bạn không thể xóa nhà này vào lúc này</h2>
                    <p className="text-gray-700 mb-4">
                        Bạn đang có người đang thuê, vui lòng liên hệ người thuê để hủy thuê trước khi xóa nhà!
                    </p>
                    </div>
                </div>
            )}

            {showHiddenPopup && bookingPending.length == 0 && !bookingNow && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
                    onClick={handleClosePopup(setShowHiddenPopup)}
                >
                    <div className="bg-white rounded-lg p-6 w-96">
                        <h2 className="text-lg font-bold mb-4 text-red-500">
                            {place.status === 'SEE' ? 'Xác nhận ẩn nhà này?' : 'Xác nhận hiển thị nhà này?'}
                        </h2>
                        <p className="text-gray-700 mb-4">
                            {place.status === 'SEE' ? 'Bạn có chắc chắn muốn ẩn nhà này không?' : 'Bạn có chắc chắn muốn hiển thị nhà này không?'}
                        </p>
                        <div className="flex justify-end">
                            <button
                                onClick={hiddenHome}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg"
                            >
                                {place.status === 'SEE' ? 'Ẩn nhà này' : 'Hiển thị nhà này'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showHiddenPopup && (bookingPending.length > 0 || bookingNow) && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
                    onClick={handleClosePopup(setShowHiddenPopup)}
                >
                    <div className="bg-white rounded-lg p-6 w-96">
                        <h2 className="text-lg font-bold mb-4 text-red-500">Bạn không thể ẩn nhà này vào lúc này</h2>
                        <p className="text-gray-700 mb-4">
                            Bạn đang có người đang booking, vui lòng xóa danh sách các người đang chờ để ẩn nhà!
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PlaceDetail;
