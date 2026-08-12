import React from 'react'
import { CheckCircle, AlertCircle, X, AlertTriangle } from 'lucide-react'

const Feedback = ({ feedbackMsg, setFeedbackMsg }) => {

    let style="bg-amber-200 border border-amber-500 text-amber-700";
    if(feedbackMsg.type==="success"){
        style="bg-green-200 border border-green-500 text-green-700";
    }
    else if(feedbackMsg.type==="error"){
        style="bg-red-200 border border-red-400 text-red-700";
    }

    return (
        <div className={`mb-4 p-3 rounded-xl border flex items-center justify-between ${style}`}>
            <div className='flex items-center gap-2'>
                {feedbackMsg.type==="success" && <CheckCircle className='w-4 h-4 text-green-500'/>}
                {feedbackMsg.type==="error" && <AlertCircle className='w-4 h-4 text-red-500'/>}
                {feedbackMsg.type==="info" && <AlertTriangle className='w-4 h-4 text-amber-500'/> }
                <span>{feedbackMsg.text}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)}>
                <X className='w-4 h-4 cursor-pointer' />
            </button>
        </div>
    )
}

export default Feedback
