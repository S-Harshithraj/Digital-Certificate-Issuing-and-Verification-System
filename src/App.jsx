import { useState } from 'react'
import { jsPDF } from 'jspdf'
import './App.css'

const API_URL = 'https://dnktkji9y6l4a.cloudfront.net'

function App() {
  const [student, setStudent] = useState({
    name: '',
    email: '',
    course: '',
    date: ''
  })

  const [certificate, setCertificate] = useState(null)
  const [verifyId, setVerifyId] = useState('')
  const [verificationResult, setVerificationResult] = useState(null)

  function handleChange(e) {
    setStudent({
      ...student,
      [e.target.name]: e.target.value
    })
  }

  

async function generateCertificate(e) {
  e.preventDefault()

  const newCertificate = {
    ...student,
    id: 'CERT-' + Date.now().toString().slice(-8)
  }

  try {
    const response = await fetch(
      `${API_URL}/api/certificates`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCertificate)
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to save certificate')
    }

    setCertificate({
      ...data.certificate,
      id: data.certificate.certificateId
    })

    alert('Certificate saved to DynamoDB!')
  } catch (error) {
    console.error(error)
    alert('Error: ' + error.message)
  }
}



  function downloadPDF() {
    if (!certificate) return

    const doc = new jsPDF()

    doc.setDrawColor(30, 80, 150)
    doc.setLineWidth(1.5)
    doc.rect(10, 10, 190, 277)

    doc.setFontSize(22)
    doc.setTextColor(30, 80, 150)
    doc.text('CERTIFICATE OF COMPLETION', 105, 45, {
      align: 'center'
    })

    doc.setFontSize(14)
    doc.setTextColor(40, 40, 40)
    doc.text('This certificate is proudly presented to', 105, 70, {
      align: 'center'
    })

    doc.setFontSize(24)
    doc.text(certificate.name, 105, 95, {
      align: 'center'
    })

    doc.setFontSize(14)
    doc.text('For successfully completing the course', 105, 120, {
      align: 'center'
    })

    doc.setFontSize(20)
    doc.text(certificate.course, 105, 140, {
      align: 'center',
      maxWidth: 170
    })

    doc.setFontSize(12)
    doc.text(`Certificate ID: ${certificate.id}`, 25, 190)
    doc.text(`Issue Date: ${certificate.date}`, 25, 205)

    doc.setFontSize(11)
    doc.text(
      'Digital Certificate Issuing & Verification System',
      105,
      250,
      { align: 'center' }
    )

    doc.save(`${certificate.id}.pdf`)
  }

  
async function verifyCertificate(e) {
  e.preventDefault()

  try {
    const response = await fetch(
      
`${API_URL}/api/certificates/${encodeURIComponent(verifyId.trim())}`

    )

    const data = await response.json()

    if (!response.ok) {
      setVerificationResult({ valid: false, details: null })
      return
    }

    setVerificationResult({
      valid: true,
      details: {
        id: data.certificate.certificateId,
        name: data.certificate.name,
        course: data.certificate.course,
        email: data.certificate.email,
        date: data.certificate.date
      }
    })
  } catch (error) {
    console.error(error)
    alert('Could not connect to backend. Check if server is running.')
  }
}


  return (
    <div className="app">
      <header>
        <h1>Digital Certificate System</h1>
        <p>Certificate Issuing &amp; Verification Portal</p>
      </header>

      <main>
        <section className="card">
          <h2>Generate Certificate</h2>

          <form onSubmit={generateCertificate}>
            <label>Student Name</label>
            <input
              name="name"
              value={student.name}
              onChange={handleChange}
              placeholder="Enter student name"
              required
            />

            <label>Student Email</label>
            <input
              type="email"
              name="email"
              value={student.email}
              onChange={handleChange}
              placeholder="Enter email address"
              required
            />

            <label>Course Name</label>
            <input
              name="course"
              value={student.course}
              onChange={handleChange}
              placeholder="Enter course name"
              required
            />

            <label>Issue Date</label>
            <input
              type="date"
              name="date"
              value={student.date}
              onChange={handleChange}
              required
            />

            <button type="submit">Generate Certificate</button>
          </form>
        </section>

        {certificate && (
          <section className="card result">
            <h2>Certificate Generated!</h2>
            <p><b>Certificate ID:</b> {certificate.id}</p>
            <p><b>Student:</b> {certificate.name}</p>
            <p><b>Email:</b> {certificate.email}</p>
            <p><b>Course:</b> {certificate.course}</p>
            <p><b>Issue Date:</b> {certificate.date}</p>
            <p>Certificate details generated successfully.</p>

            <button type="button" onClick={downloadPDF}>
              Download Certificate PDF
            </button>
          </section>
        )}

        <section className="card">
          <h2>Verify Certificate</h2>

          <form onSubmit={verifyCertificate}>
            <label>Certificate ID</label>
            <input
              value={verifyId}
              onChange={(e) => {
                setVerifyId(e.target.value)
                setVerificationResult(null)
              }}
              placeholder="Enter Certificate ID"
              required
            />

            <button type="submit">Verify Certificate</button>
          </form>

          {verificationResult && (
            <div className="result">
              {verificationResult.valid ? (
                <>
                  <h3>Certificate Verified!</h3>
                  <p>Status: Valid</p>
                  <p>Student: {verificationResult.details.name}</p>
                  <p>Course: {verificationResult.details.course}</p>
                  <p>Certificate ID: {verificationResult.details.id}</p>
                </>
              ) : (
                <>
                  <h3>Certificate Not Found</h3>
                  <p>No matching certificate was found.</p>
                </>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
