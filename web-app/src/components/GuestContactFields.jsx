export default function GuestContactFields({ values, errors, onChange }) {
  return (
    <>
      <div className="field">
        <label>Full Name</label>
        <input
          type="text"
          placeholder="e.g. Sarah Thompson"
          value={values.name}
          onChange={(e) => onChange('name', e.target.value)}
        />
        {errors.name && <div className="field-error">{errors.name}</div>}
      </div>

      <div className="field">
        <label>Email Address</label>
        <input
          type="email"
          placeholder="e.g. sarah@email.com"
          value={values.email}
          onChange={(e) => onChange('email', e.target.value)}
        />
        {errors.email && <div className="field-error">{errors.email}</div>}
      </div>

      <div className="field">
        <label>UK Mobile Number</label>
        <input
          type="tel"
          placeholder="e.g. 07123 456789"
          value={values.phone}
          onChange={(e) => onChange('phone', e.target.value)}
        />
        {errors.phone && <div className="field-error">{errors.phone}</div>}
      </div>
    </>
  );
}
