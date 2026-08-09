import React from 'react'
import { CheckCircle, AlertCircle, X } from 'lucide-react'

const Feedback = ({ feedbackMsg, setFeedbackMsg }) => {
    return (
        <div className={`mb-4 p-3 rounded-xl border flex items-center justify-between ${feedbackMsg.type === "success" ? "bg-green-200 border-green-300 text-green-600" : "bg-red-200 border-red-300 text-red-600"}`}>
            <div className='flex items-center gap-2'>
                {feedbackMsg.type === "success" ? (
                    <CheckCircle className='w-4 h-4 text-green-500' />
                ) : (
                    <AlertCircle className='w-4 h-4 text-red-500' />
                )}
                <span>{feedbackMsg.text}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)}>
                <X className='w-4 h-4 cursor-pointer' />
            </button>
        </div>
    )
}

export default Feedback
